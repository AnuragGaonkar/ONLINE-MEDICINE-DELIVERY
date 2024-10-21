from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk
from fuzzywuzzy import process  # For fuzzy matching

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/medicineDB"  # Adjust your MongoDB URI
mongo = PyMongo(app)

# Initialize a cache to store chat history and last mentioned medicine
chat_history = []
last_mentioned_medicine = None  # Track the last mentioned medicine globally
awaiting_cart_confirmation = False  # Track if awaiting cart confirmation
last_medicines_for_cart = []  # Store medicines to be added to cart
quantities = {}  # Track quantities for each medicine to be added to cart

# Tokenization function
def tokenize(text):
    words = nltk.word_tokenize(text.lower())
    words = [word for word in words if word.isalnum()]
    return words

# Function to find relevant medicines based on symptoms
def find_medicines(symptoms):
    medicines = mongo.db.medicines.find()
    medicine_scores = []

    for medicine in medicines:
        score = 0
        # Check for matching symptoms in uses
        for i in range(5):  # Check up to use0 to use4
            use_key = f'use{i}'
            if medicine[use_key] and medicine[use_key] in symptoms:
                score += 1

        # Append medicines with a score greater than 0
        if score > 0:
            medicine_scores.append({
                'name': medicine['name'],
                'description': medicine['description'],
                'dosage': medicine['dosage'],
                'price': medicine['price'],
                'delivery_time': medicine['delivery_time'],
                'in_stock': medicine['in_stock'],
                'score': score
            })

    # Sort by score in descending order and return top 5
    medicine_scores.sort(key=lambda x: x['score'], reverse=True)
    return medicine_scores[:5]

# Function to get medicine details based on user query
def get_medicine_details(medicine_name, queries):
    # Retrieve medicine details from MongoDB
    medicine = mongo.db.medicines.find_one({"name": {"$regex": medicine_name, "$options": "i"}})
    if not medicine:
        return "Sorry, I could not find any details about that medicine."
    
    # Prepare a list to hold multiple responses
    response_parts = []
    
    # Handle different types of queries
    if "price" in queries:
        response_parts.append(f"The price of {medicine['name']} is {medicine['price']}.")
    if "dosage" in queries:
        response_parts.append(f"The recommended dosage for {medicine['name']} is {medicine['dosage']}.")
    if "side effects" in queries:
        response_parts.append(f"The side effects of {medicine['name']} include {', '.join(medicine['side_effects'])}.")
    if "precautions" in queries:
        response_parts.append(f"Precautions for {medicine['name']} include {', '.join(medicine['precautions'])}.")
    if "alternatives" in queries:
        response_parts.append(f"Some alternatives for {medicine['name']} are {', '.join(medicine['alternativeMedicines'])}.")
    if "availability" in queries:
        response_parts.append(f"{medicine['name']} is currently {'available' if medicine['in_stock'] else 'not available'} in stock.")
    if "delivery" in queries:
        response_parts.append(f"The delivery time for {medicine['name']} is {medicine['delivery_time']}.")
    if "uses" in queries or "how to use" in queries:
        uses = [medicine[f'use{i}'] for i in range(5) if medicine.get(f'use{i}')]
        response_parts.append(f"The uses of {medicine['name']} include: {', '.join(uses)}.")
    
    # Join all the response parts into a single response string
    return ' '.join(response_parts) if response_parts else "I'm sorry, I cannot provide that information."

# Function to handle default responses for common greetings or general queries
def get_default_response(message):
    global last_mentioned_medicine  # Access the last mentioned medicine

    greetings = ['hello', 'hi', 'hey', 'howdy', 'greetings']
    # Check if the message is a greeting
    if any(greeting in message.lower() for greeting in greetings):
        return "Hello! How can I assist you today?"

    # Queries for specific medicine details
    medicine_queries = [
        "price", "how to use", "side effects", 
        "precautions", "alternatives", 
        "where can I buy", "is it safe", "dosage",
        "delivery", "delivery time", "uses"
    ]
    
    # Tokenize message and identify possible queries
    tokens = tokenize(message)
    found_queries = [query for query in medicine_queries if query in message.lower()]

    # Extracting the potential medicine name
    medicine_names = [med['name'] for med in mongo.db.medicines.find()]
    found_medicines = process.extract(message, medicine_names, limit=1)

    # If a new medicine is mentioned
    if found_queries and found_medicines and found_medicines[0][1] > 80:  # Only consider if matching score is high
        medicine_name = found_medicines[0][0]
        last_mentioned_medicine = medicine_name  # Update last mentioned medicine
        details_response = get_medicine_details(medicine_name, found_queries)
        if details_response:
            return details_response

    # If the user asked about the last mentioned medicine and the current query does not specify a new medicine
    if last_mentioned_medicine and found_queries:
        details_response = get_medicine_details(last_mentioned_medicine, found_queries)
        if details_response:
            return details_response

    return None  # No default response, continue to find medicines

# Function to handle cart-related operations
def handle_cart(message):
    global last_medicines_for_cart
    global awaiting_cart_confirmation
    global quantities

    if "add to cart" in message.lower():
        medicines = [med['name'] for med in mongo.db.medicines.find()]
        found_medicines = process.extract(message, medicines, limit=5)
        matched_medicines = [med[0] for med in found_medicines if med[1] > 80]

        if matched_medicines:
            last_medicines_for_cart = matched_medicines
            awaiting_cart_confirmation = True
            return f"Do you want to add {', '.join(last_medicines_for_cart)} to your cart? If so, please specify the quantities."

        return "Please specify the medicines you want to add to the cart."

    # Handle quantity input
    if awaiting_cart_confirmation:
        tokens = tokenize(message)
        quantities_response = []
        for med in last_medicines_for_cart:
            for token in tokens:
                if token.isdigit():
                    quantities[med] = int(token)
                    quantities_response.append(f"{med}: {token}")

        # Check if all quantities are provided
        if len(quantities_response) == len(last_medicines_for_cart):
            # Save the medicines and quantities to the MongoDB cart collection
            for med, qty in quantities.items():
                mongo.db.cart.insert_one({
                    "medicine": med,
                    "quantity": qty
                })

            awaiting_cart_confirmation = False  # Reset confirmation status
            return f"Added to cart: {', '.join(quantities_response)}. Would you like to proceed with the checkout?"

        elif quantities_response:
            return f"Added to cart: {', '.join(quantities_response)}. Please specify the quantities for the remaining medicines."

    return None


@app.route('/chat', methods=['POST'])
def chat():
    global chat_history, awaiting_cart_confirmation, last_medicines_for_cart, quantities

    user_message = request.json.get('message')
    chat_history.append(user_message)

    # Handle cart-related queries
    cart_response = handle_cart(user_message)
    if cart_response:
        return jsonify({'message': cart_response, 'medicines': last_medicines_for_cart, 'quantities': quantities})

    # Check for a default response first
    default_response = get_default_response(user_message)
    if default_response:
        return jsonify({'message': default_response, 'medicines': []})

    # Tokenize user message to extract symptoms
    tokens = tokenize(user_message)
    medicines = find_medicines(tokens)

    if medicines:
        global last_mentioned_medicine
        last_mentioned_medicine = medicines[0]['name']  # Update last mentioned medicine
        response = {
            'message': "Here are the recommended medicines for your symptoms:",
            'medicines': medicines
        }
    else:
        response = {
            'message': "I'm sorry, I couldn't find any medicines for your symptoms.",
            'medicines': []
        }

    return jsonify(response)

@app.route('/view_cart', methods=['GET'])
def view_cart():
    cart_items = mongo.db.cart.find()  # Fetch all items in the cart
    cart_list = [{"medicine": item["medicine"], "quantity": item["quantity"]} for item in cart_items]
    return jsonify(cart_list)

if __name__ == '__main__':
    app.run(debug=True)
