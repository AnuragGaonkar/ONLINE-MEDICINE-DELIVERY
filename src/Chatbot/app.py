import os
from datetime import datetime
import spacy
from spacy.matcher import PhraseMatcher
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk
from fuzzywuzzy import process, fuzz
import re
from bson.objectid import ObjectId, InvalidId

# ----------------- NLTK SETUP -----------------
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)

# ----------------- FLASK APP -----------------
app = Flask(__name__)

FRONTEND_URLS = [
    "http://localhost:3000",
    "https://mediquick-pqv7.onrender.com",
]

# ---------- MONGO CONFIG ----------
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    print("WARNING: MONGO_URI environment variable is not set.")

app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

CORS(app, origins=FRONTEND_URLS)

nlp = spacy.blank("en")

# ----------------- GLOBAL CACHE -----------------
matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

def initialize_matcher():
    """Load medical patterns from DB once on startup."""
    try:
        print("Loading medical patterns...")
        all_use_phrases = set()
        if mongo.db:
            for med in mongo.db.medicines.find():
                for i in range(5):
                    use = med.get(f"use{i}")
                    if use:
                        all_use_phrases.add(use.lower())
        
        if all_use_phrases:
            patterns = [nlp.make_doc(phrase) for phrase in all_use_phrases]
            matcher.add("MED_USE", patterns)
            print(f"Patterns loaded: {len(patterns)} phrases.")
            
    except Exception as e:
        print(f"Error initializing matcher: {e}")

# Call this immediately
with app.app_context():
    if MONGO_URI:
        initialize_matcher()

# ---------- DYNAMIC SYMPTOM EXTRACTION ----------
def extract_symptoms_from_text(text):
    """
    Extracts symptoms using both DB patterns AND the broad regex 
    that was working in your original code.
    """
    # 1. Exact phrase matching from DB
    doc = nlp(text.lower())
    matches = matcher(doc)
    matched_symptoms = [doc[start:end].text for match_id, start, end in matches]
    
    # 2. Broad Regex Fallback
    tokens = nltk.word_tokenize(text.lower())
    regex_symptoms = [w for w in tokens if re.match(r'^[a-z]{3,15}$', w) and len(w) > 2]
    
    # Combine results
    return list(set(matched_symptoms + regex_symptoms))[:10]

# ---------- NLP UTILITIES ----------
def tokenize(text):
    words = nltk.word_tokenize(text.lower())
    return [w for w in words if w.isalnum()]

def detect_intent(message):
    msg = message.lower()
    if any(x in msg for x in ["add", "buy", "cart", "purchase"]):
        return "ADD_TO_CART"
    if any(x in msg for x in ["price", "cost", "mrp"]):
        return "PRICE"
    if any(x in msg for x in ["dosage", "dose", "how much"]):
        return "DOSAGE"
    if any(x in msg for x in ["side effect", "effects", "reaction"]):
        return "SIDE_EFFECTS"
    if any(x in msg for x in ["precaution", "safe"]):
        return "PRECAUTIONS"
    if any(x in msg for x in ["delivery"]):
        return "DELIVERY"
    if any(x in msg for x in ["tell me", "about", "what is", "information", "details"]):
        return "MEDICINE_OVERVIEW"
    if any(x in msg for x in ["fever", "pain", "cold", "cough", "headache", "have", "suffering"]):
        return "SYMPTOMS"
    return "UNKNOWN"

# ---------- SESSION UTILITIES ----------
def get_session_id():
    explicit = request.headers.get("X-Session-Id")
    if explicit:
        return explicit
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return "anonymous"

def get_or_create_session(session_id):
    session = mongo.db.sessions.find_one({"session_id": session_id})
    if not session:
        session = {
            "session_id": session_id,
            "last_mentioned_medicine": None,
            "awaiting_cart_confirmation": False,
            "last_medicines_for_cart": [],
            "cart": [], 
        }
        mongo.db.sessions.insert_one(session)
    return session

def update_session(session_id, updates):
    mongo.db.sessions.update_one(
        {"session_id": session_id},
        {"$set": updates},
        upsert=True,
    )

def add_item_to_cart(session_id, item_name, quantity, price=None, medicine_id=None):
    """
    Helper to update persistent cart in MongoDB.
    THIS INCLUDES THE CRITICAL PRICE FIX logic.
    """
    # 1. Fetch details if missing (Price should be Numeric for calculation)
    if not price or not medicine_id:
        med = mongo.db.medicines.find_one({"name": {"$regex": f"^{item_name}$", "$options": "i"}})
        if med:
            # FIX: Prefer 'priceNumeric' if available to avoid NaN in frontend
            price = med.get('priceNumeric') if med.get('priceNumeric') else med.get('price')
            
            # Fallback: if price is still a string like "₹20", strip it
            if isinstance(price, str):
                try:
                    price = float(re.sub(r'[^\d.]', '', price))
                except:
                    price = 0
            
            medicine_id = str(med.get('_id'))
        else:
            price = 0
            medicine_id = "unknown"

    session = get_or_create_session(session_id)
    cart = session.get("cart", [])
    
    # 2. Check if item exists, update quantity if so
    found = False
    for item in cart:
        if item["name"].lower() == item_name.lower():
            item["quantity"] += quantity
            found = True
            break
    
    # 3. Add new item
    if not found:
        cart.append({
            "medicineId": medicine_id, 
            "name": item_name, 
            "quantity": quantity, 
            "price": price,
            # Add image fallback for frontend
            "imageUrl": "https://cdn-icons-png.flaticon.com/512/883/883407.png" 
        })
        
    update_session(session_id, {"cart": cart})
    return cart

# ---------- CHAT LOGGING ----------
def save_chat_turn(session_id, user_message, bot_message, medicines=None, quantities=None):
    mongo.db.chats.insert_one({
        "session_id": session_id,
        "user_message": user_message,
        "bot_message": bot_message,
        "medicines": medicines or [],
        "quantities": quantities or {},
        "timestamp": datetime.utcnow(),
    })

# ---------- SMART MEDICINE MATCHING ----------
def calculate_relevance(symptom, med_uses):
    score = 0
    all_uses = ' '.join(med_uses).lower()
    if symptom in all_uses: score += 100
    fuzzy_score = fuzz.partial_ratio(symptom, all_uses)
    if fuzzy_score >= 85: score += fuzzy_score
    elif fuzzy_score >= 70: score += fuzzy_score * 0.5
    if symptom.rstrip('s') in all_uses: score += 60
    return score

def find_medicines(symptoms):
    if not symptoms: return []
    scored = []
    for med in mongo.db.medicines.find({"in_stock": True}):
        if med.get("in_stock") is False: continue
        uses = [med.get(f"use{i}", "") for i in range(5) if med.get(f"use{i}")]
        if not uses: continue
        
        score, count = 0, 0
        for s in symptoms:
            if s in ["have", "what", "is", "the", "for", "and"]: continue
            rel = calculate_relevance(s, uses)
            if rel > 20:
                score += rel
                count += 1
        
        if count > 0:
            scored.append({
                "name": med["name"],
                "dosage": med.get("dosage", ""),
                "price": med.get("price"),
                "delivery_time": med.get("delivery_time", ""),
                "availability": "In stock",
                "score": score / count,
                "uses": uses
            })
    
    scored.sort(key=lambda x: x["score"], reverse=True)
    seen, final = set(), []
    for med in scored:
        if med["name"] not in seen:
            seen.add(med["name"])
            final.append(med)
            if len(final) == 5: break
    return final

def build_overview(med):
    uses = [med.get(f"use{i}") for i in range(5) if med.get(f"use{i}")]
    stock = "In Stock" if med.get("in_stock") else "Out of Stock"
    return f"{med['name']} is used for {', '.join(uses[:3])}. Dosage: {med.get('dosage')}. Price: {med.get('price')}. Stock: {stock}."

def get_medicine_details(med_name, intent):
    med = mongo.db.medicines.find_one({"name": {"$regex": med_name, "$options": "i"}})
    if not med: return None
    if intent == "PRICE": return f"The price of {med['name']} is {med.get('price')}."
    if intent == "DOSAGE": return f"Dosage: {med.get('dosage')}."
    if intent == "SIDE_EFFECTS": return f"Side effects: {', '.join(med.get('side_effects', []))}."
    if intent == "PRECAUTIONS": return f"Precautions: {', '.join(med.get('precautions', []))}."
    if intent == "DELIVERY": return f"Delivery time: {med.get('delivery_time')}."
    if intent == "MEDICINE_OVERVIEW": return build_overview(med)
    return None

# ---------- CART HANDLING ----------
def text_to_int(text):
    mapping = {'one':1, 'two':2, 'three':3, 'four':4, 'five':5, 'six':6, 'ten':10}
    for t in text.lower().replace(',', ' ').split():
        if t.isdigit(): return int(t)
        if t in mapping: return mapping[t]
    return None

def handle_cart_chat(session, message):
    msg = message.lower()
    # 1. User asks to add
    if "add to cart" in msg:
        names = [m["name"] for m in mongo.db.medicines.find()]
        matches = process.extract(message, names, limit=5)
        matched = [m[0] for m in matches if m[1] > 80]
        if matched:
            update_session(session["session_id"], {
                "awaiting_cart_confirmation": True,
                "last_medicines_for_cart": matched,
            })
            return {"type": "ASK_QUANTITY", "message": f"How many units of {', '.join(matched)} would you like to add?"}

    # 2. User confirms quantity
    if session.get("awaiting_cart_confirmation"):
        qty = text_to_int(message)
        if qty:
            meds = session["last_medicines_for_cart"][:]
            
            # --- PERSIST TO DB ---
            current_cart = []
            for m in meds:
                current_cart = add_item_to_cart(session["session_id"], m, qty)

            update_session(session["session_id"], {
                "awaiting_cart_confirmation": False,
                "last_medicines_for_cart": []
            })
            
            return {
                "type": "ADD_TO_CART",
                "message": "I've added the items to your cart. You can proceed to checkout or add more medicines.",
                "items": current_cart 
            }
        return {"type": "ASK_QUANTITY", "message": "Please enter a valid quantity (for example: 1 or 2)."}
    return None

# ---------- FIX 500 ERROR & TYPE MISMATCH: API ROUTE ----------
@app.route("/api/cart/add", methods=["POST"])
def api_add_to_cart():
    try:
        session_id = get_session_id()
        data = request.get_json(force=True)
        
        # 1. Extract params (Handle both 'name' and 'medicineId')
        # This handles the frontend sending ID and the Chatbot sending Name
        name = data.get("name")
        medicine_id = data.get("medicineId")
        quantity = int(data.get("quantity", 1))
        
        resolved_name = None
        resolved_id = None

        if medicine_id:
            # Check if it's a valid ID from the Frontend
            if ObjectId.is_valid(medicine_id):
                med = mongo.db.medicines.find_one({"_id": ObjectId(medicine_id)})
                if med:
                    resolved_name = med["name"]
                    resolved_id = str(med["_id"])
            else:
                # Chatbot sometimes sends Name as ID field erroneously
                resolved_name = medicine_id 

        if not resolved_name and name:
            resolved_name = name

        if not resolved_name:
            return jsonify({"error": "Product name or valid ID is required"}), 400

        # 3. Update persistent cart (Uses name to lookup price/ID if missing)
        updated_cart = add_item_to_cart(session_id, resolved_name, quantity, medicine_id=resolved_id)
        
        # 4. Return correct structure matching Frontend 'data.cart.items' expectation
        return jsonify({
            "success": True, 
            "message": "Item added to cart", 
            "cart": { "items": updated_cart } 
        })
        
    except Exception as e:
        print(f"API Cart Error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------- MAIN CHAT ROUTE ----------
@app.route("/chat", methods=["POST"])
def chat():
    session_id = get_session_id()
    session = get_or_create_session(session_id)
    data = request.get_json(force=True)
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"message": "Please enter a message.", "medicines": []}), 400

    intent = detect_intent(user_message)

    # Cart handling
    cart_result = handle_cart_chat(session, user_message)
    if cart_result:
        save_chat_turn(session_id, user_message, cart_result["message"])
        return jsonify(cart_result)

    if "proceed to checkout" in user_message.lower():
        return jsonify({"type": "PROCEED_TO_CHECKOUT", "message": "Taking you to the checkout page."})

    # Detect medicine mention
    medicine_names = [m["name"] for m in mongo.db.medicines.find()]
    match = process.extract(user_message, medicine_names, limit=1)

    if match and match[0][1] > 80:
        update_session(session_id, {"last_mentioned_medicine": match[0][0]})
        session["last_mentioned_medicine"] = match[0][0]

    # 1) Direct medicine details
    if session.get("last_mentioned_medicine") and intent != "UNKNOWN" and intent != "SYMPTOMS":
        reply = get_medicine_details(session["last_mentioned_medicine"], intent)
        if reply:
            save_chat_turn(session_id, user_message, reply, medicines=[session["last_mentioned_medicine"]])
            return jsonify({"message": reply, "medicines": []})

    # 2) Symptom-based
    symptoms = extract_symptoms_from_text(user_message)
    
    if not user_message.strip():
        return jsonify({"message": "Hi! What symptoms do you have?", "medicines": []})

    # Typo Correction
    common_symptoms = ["ulcer", "fever", "pain", "headache", "cold", "cough", "stomach", "acidity", "vomiting"]
    for symptom in symptoms[:]:
        for common in common_symptoms:
            if fuzz.ratio(symptom, common) > 80:
                if common not in symptoms:
                    symptoms.append(common)
                break

    # Allergy Handling
    user_lower = user_message.lower()
    is_allergy_query = any(k in user_lower for k in ["allergic", "allergy", "rash", "reaction", "hives", "itching"])
    
    if is_allergy_query:
        meds = find_medicines(["allergic rhinitis", "hay fever", "urticaria", "allergies", "itching"])
        intro_text = "🌿 Here are medicines commonly used for allergies:\n"
    else:
        meds = find_medicines(symptoms)
        intro_text = "Based on what you described, these medicines may help:\n"

    meds = [m for m in meds if m.get("availability") == "In stock"]

    if meds:
        update_session(session_id, {"last_mentioned_medicine": meds[0]["name"]})
        msg_lines = [intro_text]
        for med in meds:
            # Human-friendly match text
            score = med.get('score', 0)
            if score > 130: match_text = "Highly Recommended"
            elif score > 90: match_text = "Good Match"
            else: match_text = "Also effective"

            # FULL VERBOSITY IN CHAT RESPONSE
            msg_lines.append(
                f"\n• {med['name']} ({match_text})"
                f"\n  Dosage: {med.get('dosage', 'See details')}"
                f"\n  Price: {med.get('price')}"
                f"\n  Delivery: {med.get('delivery_time', 'Standard')}"
                f"\n  Availability: {med.get('availability', 'In Stock')}"
            )
        msg = "\n".join(msg_lines)
        save_chat_turn(session_id, user_message, msg, medicines=[m["name"] for m in meds])
        return jsonify({"message": msg, "medicines": meds})

    # 3) Fallback
    fallback = "I'm not fully sure what you mean. You can tell me your symptoms (for example: stomach pain, fever, acidity) or ask about a specific medicine."
    save_chat_turn(session_id, user_message, fallback)
    return jsonify({"message": fallback, "medicines": []})

# ---------- HISTORY ----------
@app.route("/chat_history", methods=["GET"])
def history():
    session_id = get_session_id()
    chats = mongo.db.chats.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1)
    return jsonify(list(chats))

# ---------- HEALTH CHECK ----------
@app.route("/", methods=["GET"])
def health():
    try:
        mongo.db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return jsonify({"status": "ok", "mongo": mongo_ok}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)