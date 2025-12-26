from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk
from fuzzywuzzy import process
from datetime import datetime

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", quiet=True)

try:
    nltk.data.find("tokenizers/punkt_tab")
except LookupError:
    nltk.download("punkt_tab", quiet=True)
    
app = Flask(__name__)

# ---------- CONFIG ----------

FRONTEND_URLS = [
    "http://localhost:3000",
    "https://mediquick-pqv7.onrender.com",   # deployed React frontend
]

MONGO_URI = (
    "mongodb+srv://mediquick_user:peCbDdnm3ZC1EpHv@mediquick-cluster.sdrfhkz.mongodb.net/"
)

app.config["MONGO_URI"] = MONGO_URI
mongo = PyMongo(app)

# Allow both local and deployed frontend
CORS(app, origins=FRONTEND_URLS)

# ---------- HEALTH CHECK ----------

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ----------------- SESSION UTILITIES -----------------

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


# ----------------- NLP UTILITIES -----------------

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


# ----------------- CHAT LOGGING -----------------

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


# ----------------- MEDICINE LOGIC -----------------

def find_medicines(symptoms):
    results = []
    for med in mongo.db.medicines.find():
        score = 0
        for i in range(5):
            key = f"use{i}"
            if med.get(key) and med[key] in symptoms:
                score += 1
        if score > 0:
            results.append(
                {
                    "name": med["name"],
                    "description": med["description"],
                    "dosage": med["dosage"],
                    "price": med["price"],
                    "delivery_time": med["delivery_time"],
                    "in_stock": med["in_stock"],
                    "score": score,
                }
            )
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:5]


def build_overview(med):
    uses = [med.get(f"use{i}") for i in range(5) if med.get(f"use{i}")]
    return (
        f"{med['name']} is commonly used for {', '.join(uses)}. "
        f"The recommended dosage is {med['dosage']}. "
        f"It costs ₹{med['price']}. "
        f"The delivery time is {med['delivery_time']}."
    )


def get_medicine_details(med_name, intent):
    med = mongo.db.medicines.find_one(
        {"name": {"$regex": med_name, "$options": "i"}}
    )

    if not med:
        return None

    if intent == "PRICE":
        return f"The price of {med['name']} is ₹{med['price']}."

    if intent == "DOSAGE":
        return f"The recommended dosage for {med['name']} is {med['dosage']}."

    if intent == "SIDE_EFFECTS" and med.get("side_effects"):
        return f"The side effects include {', '.join(med['side_effects'])}."

    if intent == "PRECAUTIONS" and med.get("precautions"):
        return f"Precautions include {', '.join(med['precautions'])}."

    if intent == "DELIVERY":
        return f"The delivery time for {med['name']} is {med['delivery_time']}."

    if intent == "MEDICINE_OVERVIEW":
        return build_overview(med)

    return None


# ----------------- CART HANDLING -----------------

def handle_cart(session, message):
    if "add to cart" in message.lower():
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
            return f"Please specify quantity for {', '.join(matched)}."

    if session.get("awaiting_cart_confirmation"):
        tokens = tokenize(message)
        qty = next((int(t) for t in tokens if t.isdigit()), None)

        if qty:
            for med in session["last_medicines_for_cart"]:
                mongo.db.cart.insert_one(
                    {
                        "medicine": med,
                        "quantity": qty,
                        "session_id": session["session_id"],
                    }
                )

            update_session(
                session["session_id"],
                {
                    "awaiting_cart_confirmation": False,
                    "last_medicines_for_cart": [],
                },
            )

            return "Items added to cart successfully."

    return None


# ----------------- MAIN CHAT ROUTE -----------------

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
    cart_reply = handle_cart(session, user_message)
    if cart_reply:
        save_chat_turn(session_id, user_message, cart_reply)
        return jsonify({"message": cart_reply, "medicines": []})

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
    meds = find_medicines(tokenize(user_message))
    if meds:
        update_session(session_id, {"last_mentioned_medicine": meds[0]["name"]})

        numbered = []
        for idx, med in enumerate(meds, start=1):
            numbered.append(
                f"""{idx}. {med['name']}
Dosage: {med['dosage']}
Price: {med['price']}
Delivery: {med['delivery_time']}"""
            )
        meds_block = "\n\n".join(numbered)

        msg = (
            "Here are some medicines that may help with your symptoms.\n\n"
            + meds_block
        )

        save_chat_turn(
            session_id,
            user_message,
            msg,
            medicines=[m["name"] for m in meds],
        )
        return jsonify({"message": msg, "medicines": meds})

    # 3) Fallback
    fallback = (
        "I could not understand that. You can ask about a medicine, "
        "its price, dosage, side effects, or delivery time."
    )
    save_chat_turn(session_id, user_message, fallback)
    return jsonify({"message": fallback, "medicines": []})


# ----------------- VIEW CART -----------------

@app.route("/view_cart", methods=["GET"])
def view_cart():
    session_id = get_session_id()
    items = mongo.db.cart.find({"session_id": session_id})
    return jsonify(
        [{"medicine": i["medicine"], "quantity": i["quantity"]} for i in items]
    )


# ----------------- HISTORY -----------------

@app.route("/chat_history", methods=["GET"])
def history():
    session_id = get_session_id()
    chats = (
        mongo.db.chats.find({"session_id": session_id}, {"_id": 0})
        .sort("timestamp", 1)
    )
    return jsonify(list(chats))
