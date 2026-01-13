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
    # Fallback for local testing if env var not set, or raise error
    # raise RuntimeError("MONGO_URI environment variable is not set")
    print("WARNING: MONGO_URI not set.")

app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

CORS(app, origins=FRONTEND_URLS)

nlp = spacy.blank("en")

# ----------------- GLOBAL CACHE (FIX 1) -----------------
# We initialize the matcher globally to avoid DB reads on every request
matcher = PhraseMatcher(nlp.vocab, attr="LOWER")

def initialize_matcher():
    """Load medical patterns from DB once on startup."""
    try:
        print("Loading medical patterns...")
        all_use_phrases = set()
        # Fetch all meds once
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
        else:
            print("No patterns found in DB or DB not connected.")
            
    except Exception as e:
        print(f"Error initializing matcher: {e}")

# Call this immediately within app context
with app.app_context():
    if MONGO_URI:
        initialize_matcher()

# ---------- DYNAMIC SYMPTOM EXTRACTION ----------
def extract_symptoms_from_text(text):
    """Extract symptoms using the pre-loaded global matcher."""
    # Only does NLP processing, no DB calls
    doc = nlp(text.lower())
    matches = matcher(doc)
    matched_symptoms = [doc[start:end].text for match_id, start, end in matches]
    
    # Simple regex/token fallback for common non-phrased symptoms
    tokens = nltk.word_tokenize(text.lower())
    manual_symptoms = [w for w in tokens if w in ["fever", "pain", "headache", "cough", "cold", "flu", "acidity", "gas"]]
    
    # Combine and deduplicate
    return list(set(matched_symptoms + manual_symptoms))[:5]

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
    if any(x in msg for x in ["fever", "pain", "cold", "cough", "headache"]):
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
            "quantities": {},
        }
        mongo.db.sessions.insert_one(session)
    return session

def update_session(session_id, updates):
    mongo.db.sessions.update_one(
        {"session_id": session_id},
        {"$set": updates},
        upsert=True,
    )

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
    """Dynamic relevance scoring using fuzzy matching."""
    score = 0
    all_uses = ' '.join(med_uses).lower()
    
    # Exact match
    if symptom in all_uses:
        score += 100
    
    # Fuzzy partial match
    fuzzy_score = fuzz.partial_ratio(symptom, all_uses)
    if fuzzy_score >= 85:
        score += fuzzy_score
    elif fuzzy_score >= 70:
        score += fuzzy_score * 0.5
    
    # Stemmed word match
    symptom_stem = symptom.rstrip('s')  # ulcers -> ulcer
    if symptom_stem in all_uses:
        score += 60
    
    return score

def find_medicines(symptoms):
    """INTELLIGENT matching: scores ALL medicines, ranks by relevance."""
    if not symptoms:
        return []
    
    scored_medicines = []
    
    # UPDATED STOCK CHECK: Use boolean 'in_stock' field correctly
    for med in mongo.db.medicines.find({"in_stock": True}):
        # Double check specifically for False or 0 stock if numeric exists
        if med.get("in_stock") is False:
            continue
        
        uses = [med.get(f"use{i}", "") for i in range(5) if med.get(f"use{i}")]
        if not uses:
            continue
        
        total_score = 0
        match_count = 0
        
        for symptom in symptoms:
            relevance = calculate_relevance(symptom, uses)
            if relevance > 20:  # Threshold for relevance
                total_score += relevance
                match_count += 1
        
        if match_count > 0:
            scored_medicines.append({
                "name": med["name"],
                "dosage": med.get("dosage", ""),
                "price": med.get("price"),
                "delivery_time": med.get("delivery_time", ""),
                "availability": "In stock", # We filtered query by in_stock=True
                "score": total_score / match_count,  # Average relevance
                "matched_symptoms": [s for s in symptoms if calculate_relevance(s, uses) > 20],
                "uses": uses
            })
    
    # Rank by score, dedupe, top 5
    scored_medicines.sort(key=lambda x: x["score"], reverse=True)
    seen = set()
    final = []
    for med in scored_medicines:
        if med["name"] not in seen:
            seen.add(med["name"])
            final.append(med)
            if len(final) == 5:
                break
    
    return final

def build_overview(med):
    uses = [med.get(f"use{i}") for i in range(5) if med.get(f"use{i}")]
    stock_val = "In Stock" if med.get("in_stock") else "Out of Stock"
    stock_info = f" Current stock: {stock_val}."
    return (
        f"{med['name']} is commonly used for {', '.join(uses[:3])}. "  # Show top 3 uses
        f"The recommended dosage is {med.get('dosage', 'not specified')}. "
        f"It costs {med.get('price')}. "
        f"The delivery time is {med.get('delivery_time', 'not specified')}."
        + stock_info
    )

def get_medicine_details(med_name, intent):
    med = mongo.db.medicines.find_one({"name": {"$regex": med_name, "$options": "i"}})
    if not med:
        return None

    if intent == "PRICE":
        stock_val = "In Stock" if med.get("in_stock") else "Out of Stock"
        return f"The price of {med['name']} is {med.get('price')}. Availability: {stock_val}."

    if intent == "DOSAGE":
        return f"The recommended dosage for {med['name']} is {med.get('dosage', 'not specified')}."

    if intent == "SIDE_EFFECTS" and med.get("side_effects"):
        return f"The side effects include {', '.join(med['side_effects'])}."

    if intent == "PRECAUTIONS" and med.get("precautions"):
        return f"Precautions include {', '.join(med['precautions'])}."

    if intent == "DELIVERY":
        return f"The delivery time for {med['name']} is {med.get('delivery_time', 'not specified')}."

    if intent == "MEDICINE_OVERVIEW":
        return build_overview(med)

    return None

# ---------- CART HANDLING (FIX 3) ----------
def text_to_int(text):
    """Helper to convert number words to integers."""
    mapping = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    }
    # Check digits or words
    for t in text.lower().replace(',', ' ').split():
        if t.isdigit(): 
            return int(t)
        if t in mapping: 
            return mapping[t]
    return None

def handle_cart(session, message):
    msg = message.lower()
    if "add to cart" in msg:
        names = [m["name"] for m in mongo.db.medicines.find()]
        matches = process.extract(message, names, limit=5)
        matched = [m[0] for m in matches if m[1] > 80]
        if matched:
            update_session(session["session_id"], {
                "awaiting_cart_confirmation": True,
                "last_medicines_for_cart": matched,
            })
            return {
                "type": "ASK_QUANTITY",
                "message": f"How many units of {', '.join(matched)} would you like to add?"
            }

    if session.get("awaiting_cart_confirmation"):
        # Use new smart parser
        qty = text_to_int(message)
        
        if qty:
            meds = session["last_medicines_for_cart"][:]
            update_session(session["session_id"], {
                "awaiting_cart_confirmation": False,
                "last_medicines_for_cart": [],
            })
            return {
                "type": "ADD_TO_CART",
                "message": (
                    "I've added the items to your cart. "
                    "You can proceed to checkout or add more medicines."
                ),
                "items": [
                    {"name": med, "quantity": qty}
                    for med in meds
                ]
            }

        return {
            "type": "ASK_QUANTITY",
            "message": "Please enter a valid quantity (for example: 1 or 2)."
        }

    return None

# ---------- MAIN CHAT ROUTE (FIX 2) ----------
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
    cart_result = handle_cart(session, user_message)
    if cart_result:
        save_chat_turn(session_id, user_message, cart_result["message"])
        return jsonify(cart_result)

    if "proceed to checkout" in user_message.lower():
        return jsonify({
            "type": "PROCEED_TO_CHECKOUT",
            "message": "Taking you to the checkout page."
        })

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
            save_chat_turn(
                session_id,
                user_message,
                reply,
                medicines=[session["last_mentioned_medicine"]],
            )
            return jsonify({"message": reply, "medicines": []})

    # 2) Symptom-based - OPTIMIZED & ALLERGY AWARE
    symptoms = extract_symptoms_from_text(user_message)

    # Auto-Edge Case: Empty or nonsense input
    if not user_message.strip():
        return jsonify({"message": "Hi! What symptoms do you have?", "medicines": []})

    # Clean symptoms
    symptoms = [s for s in symptoms if len(s) > 2 and len(s) < 15 and s.isalpha()]
    if len(symptoms) > 3:
        symptoms = symptoms[:3]

    # Typo correction
    common_symptoms = ["ulcer", "fever", "pain", "headache", "cold", "cough", "stomach", "acidity"]
    for symptom in symptoms[:]:
        for common in common_symptoms:
            if fuzz.ratio(symptom, common) > 80:
                if common not in symptoms:
                    symptoms.append(common)
                break

    # ALLERGY HANDLING + RATE LIMIT
    user_lower = user_message.lower()
    allergy_keywords = ["allergic", "allergy", "rash", "reaction", "hives", "itching"]
    is_allergy_query = any(keyword in user_lower for keyword in allergy_keywords)

    # Rate limiting (basic)
    now = datetime.utcnow()
    if session.get("last_request"):
        try:
            delta = (now - datetime.fromisoformat(session["last_request"])).total_seconds()
            if delta < 0.5: # 500ms debounce
                return jsonify({"message": "Typing fast? 😊 What symptoms?", "medicines": []})
        except ValueError:
            pass # Ignore format errors
    session["last_request"] = now.isoformat()

    # LOGIC SWITCH: Allergy Specific vs General Symptoms
    if is_allergy_query:
        # Search for medicines SPECIFICALLY for allergies
        meds = find_medicines(["allergic rhinitis", "hay fever", "urticaria", "allergies", "itching"])
        intro_text = "🌿 Here are medicines commonly used for allergies:\n"
    else:
        # Standard search
        meds = find_medicines(symptoms)
        intro_text = "Based on what you described, these medicines may help:\n"

    # STOCK CHECK FILTER (Redundant safe-guarding, find_medicines handles it, but good for UI safety)
    meds = [m for m in meds if m.get("availability") == "In stock"]

    if meds:
        update_session(session_id, {"last_mentioned_medicine": meds[0]["name"]})
        
        msg_lines = [intro_text]
        for med in meds:
            msg_lines.append(
                f"\n• {med['name']} (Match: {med['score']:.0f}%)"
                f"\n  Dosage: {med.get('dosage', 'See details')}"
                f"\n  Price: {med.get('price')}"
                f"\n  Delivery: {med.get('delivery_time', 'Standard')}"
            )
        
        msg = "\n".join(msg_lines)
        save_chat_turn(session_id, user_message, msg, medicines=[m["name"] for m in meds])
        return jsonify({"message": msg, "medicines": meds})

    # 3) Fallback
    fallback = (
        "I'm not fully sure what you mean yet. "
        "You can tell me your symptoms (for example: stomach pain, fever, acidity), "
        "or ask about a specific medicine."
    )

    save_chat_turn(session_id, user_message, fallback)
    return jsonify({"message": fallback, "medicines": []})

# ---------- HISTORY ----------
@app.route("/chat_history", methods=["GET"])
def history():
    session_id = get_session_id()
    chats = (
        mongo.db.chats.find({"session_id": session_id}, {"_id": 0})
        .sort("timestamp", 1)
    )
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