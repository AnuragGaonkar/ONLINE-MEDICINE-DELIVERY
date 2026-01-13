import os
from datetime import datetime
import spacy
from spacy.matcher import PhraseMatcher
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk
from fuzzywuzzy import process, fuzz

# ----------------- NLTK SETUP -----------------

# Make sure tokenizer models exist (needed for word_tokenize)
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

# Frontend origins allowed for CORS
FRONTEND_URLS = [
    "http://localhost:3000",
    "https://mediquick-pqv7.onrender.com",
]

# ---------- MONGO CONFIG ----------

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set")

app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

# Allow both local and deployed frontend
CORS(app, origins=FRONTEND_URLS)

nlp = spacy.blank("en")
# ---------- BUILD SYMPTOM MATCHER (DB-DRIVEN) ----------

def build_symptom_matcher():
    matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    symptom_phrases = set()

    for med in mongo.db.medicines.find():
        for i in range(5):
            use = med.get(f"use{i}")
            if use:
                symptom_phrases.add(use.lower())

    patterns = [nlp.make_doc(text) for text in symptom_phrases]
    if patterns:
        matcher.add("SYMPTOM", patterns)

    return matcher

global SYMPTOM_MATCHER
SYMPTOM_MATCHER = build_symptom_matcher()

# ---------- HEALTH CHECK ----------

@app.route("/", methods=["GET"])
def health():
    # simple check that Mongo is available
    try:
        mongo.db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return jsonify({"status": "ok", "mongo": mongo_ok}), 200

# ---------- SESSION UTILITIES ----------

def get_session_id():
    """
    Prefer a stable session id passed from frontend (userId or guest UUID).
    Fallback to token string, then 'anonymous'.
    """
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

def extract_symptoms_from_text(text):
    """
    Extract core medical terms ONLY.
    No fuzzy guessing.
    """
    tokens = tokenize(text)
    return list(set(tokens))


# ---------- CHAT LOGGING ----------

def save_chat_turn(session_id, user_message, bot_message, medicines=None, quantities=None):
    mongo.db.chats.insert_one(
        {
            "session_id": session_id,
            "user_message": user_message,
            "bot_message": bot_message,
            "medicines": medicines or [],
            "quantities": quantities or {},
            "timestamp": datetime.utcnow(),
        }
    )

# ---------- MEDICINE LOGIC ----------

def find_medicines(symptoms):
    """
    STRICT medical relevance matching.
    A medicine is suggested ONLY if:
    - a symptom word is explicitly present
    - inside a USE field (use0..use4)
    """

    results = []

    for med in mongo.db.medicines.find({"in_stock": True}):
        if med.get("stock", 1) <= 0:
            continue

        matched = False
        matched_uses = []

        for i in range(5):
            use = med.get(f"use{i}")
            if not use:
                continue

            use_l = use.lower()

            # STRICT WORD CONTAINMENT
            for symptom in symptoms:
                if symptom in use_l:
                    matched = True
                    matched_uses.append(use_l)

        if not matched:
            continue  # ❌ reject medicine completely

        results.append({
            "name": med["name"],
            "dosage": med.get("dosage", ""),
            "price": med.get("price"),
            "delivery_time": med.get("delivery_time", ""),
            "availability": "In stock" if med.get("in_stock") else "Out of stock",
            "matched_uses": matched_uses
        })

    # Remove duplicates
    seen = set()
    final = []
    for r in results:
        if r["name"] not in seen:
            seen.add(r["name"])
            final.append(r)

    return final[:5]




def build_overview(med):
    uses = [med.get(f"use{i}") for i in range(5) if med.get(f"use{i}")]
    stock_val = "In Stock" if med.get("in_stock") else "Out of Stock"
    stock_info = f" Current stock: {stock_val} units." 
    return (
        f"{med['name']} is commonly used for {', '.join(uses)}. "
        f"The recommended dosage is {med.get('dosage', 'not specified')}. "
        f"It costs {med.get('price')}. "
        f"The delivery time is {med.get('delivery_time', 'not specified')}."
        + stock_info
    )

def get_medicine_details(med_name, intent):
    med = mongo.db.medicines.find_one(
        {"name": {"$regex": med_name, "$options": "i"}}
    )

    if not med:
        return None

    if intent == "PRICE":
        stock_val = med.get("stock", 0)
        return (
            f"The price of {med['name']} is {med.get('price')}."
            f" Current stock: {stock_val} units."
        )

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

# ---------- CART HANDLING ----------

def handle_cart(session, message):
    msg = message.lower()

    # STEP 1: detect add-to-cart intent
    if "add to cart" in msg:
        names = [m["name"] for m in mongo.db.medicines.find()]
        matches = process.extract(message, names, limit=5)
        matched = [m[0] for m in matches if m[1] > 80]

        if matched:
            update_session(
                session["session_id"],
                {
                    "awaiting_cart_confirmation": True,
                    "last_medicines_for_cart": matched,
                },
            )
            return {
                "type": "ASK_QUANTITY",
                "message": f"How many units of {', '.join(matched)} would you like to add?"
            }

    # STEP 2: waiting for quantity
    if session.get("awaiting_cart_confirmation"):
        tokens = tokenize(message)
        qty = next((int(t) for t in tokens if t.isdigit()), None)

        if qty:
            meds = session["last_medicines_for_cart"][:]

            update_session(
                session["session_id"],
                {
                    "awaiting_cart_confirmation": False,
                    "last_medicines_for_cart": [],
                },
            )

            return {
                "type": "ADD_TO_CART",
                "message": (
                    "I’ve added the items to your cart. "
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
    if session.get("last_mentioned_medicine"):
        reply = get_medicine_details(session["last_mentioned_medicine"], intent)
        if reply:
            save_chat_turn(
                session_id,
                user_message,
                reply,
                medicines=[session["last_mentioned_medicine"]],
            )
            return jsonify({"message": reply, "medicines": []})

    # 2) Symptom-based
    extracted_symptoms = extract_symptoms_from_text(user_message)

    # fallback to token-based if spaCy finds nothing
    search_terms = extracted_symptoms if extracted_symptoms else tokenize(user_message)

    meds = find_medicines(search_terms)

    if meds:
        update_session(session_id, {"last_mentioned_medicine": meds[0]["name"]})

        msg_lines = [
            "Based on what you described, these medicines may help:"
        ]

        for med in meds:
            msg_lines.append(
                f"\n• {med['name']}\n"
                f"  Dosage: {med.get('dosage', 'Not specified')}\n"
                f"  Price: {med.get('price')}\n"
                f"  Delivery: {med.get('delivery_time', 'Not specified')}\n"
                f"  Availability: {med.get('availability')}"
            )

        msg = "\n".join(msg_lines)

        save_chat_turn(
            session_id,
            user_message,
            msg,
            medicines=[m["name"] for m in meds],
        )
        return jsonify({"message": msg, "medicines": meds})

    # 3) Fallback
    fallback = (
        "I’m not fully sure what you mean yet. "
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

if __name__ == "__main__":
    # for local testing only; on Render use gunicorn
    app.run(host="0.0.0.0", port=5000, debug=True)
