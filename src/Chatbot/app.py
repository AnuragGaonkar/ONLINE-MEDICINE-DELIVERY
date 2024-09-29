from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import pandas as pd
import nltk
import os
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Adjust as needed

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/medicineDB"
mongo = PyMongo(app)

# Tokenization function
def tokenize(text):
    return nltk.word_tokenize(text.lower())

# Function to find relevant medicines
def find_medicines(symptoms):
    # Get all medicines from the database
    medicines = mongo.db.medicines.find()
    matching_substitutes = []

    for medicine in medicines:
        # Check if any token matches the 'use' field
        if any(token in medicine.get('use', '').lower() for token in symptoms):
            # Add substitutes to the response
            substitutes = [medicine.get(f'substitute{i}') for i in range(4) if medicine.get(f'substitute{i}')]
            matching_substitutes.extend(substitutes)

    return matching_substitutes

@app.route('/', methods=['GET'])
def home():
    return "Flask server is running.", 200

@app.route('/load-data', methods=['POST'])
def load_data():
    try:
        # Adjust the path if necessary
        csv_path = os.path.join(os.path.dirname(__file__), 'medicine_dataset.csv')
        if not os.path.exists(csv_path):
            logger.error("medicine_dataset.csv not found.")
            return jsonify({"error": "medicine_dataset.csv not found."}), 400
        df = pd.read_csv(csv_path)
        data = df.to_dict(orient='records')
        mongo.db.medicines.insert_many(data)
        logger.info("Data loaded successfully.")
        return jsonify({"message": "Data loaded successfully!"}), 200
    except Exception as e:
        logger.error(f"Error loading data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        
        # Tokenize the user's message
        tokens = tokenize(user_message)

        # Find matching medicines based on tokens
        matching_substitutes = find_medicines(tokens)

        # Prepare the response
        if matching_substitutes:
            response_message = {
                "message": "We found the following medicines for your symptoms:",
                "substitutes": matching_substitutes
            }
        else:
            response_message = {
                "message": "I'm sorry, I couldn't find any medicines for your symptoms."
            }

        return jsonify(response_message), 200
    except Exception as e:
        logger.error(f"Error in /chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    nltk.download('punkt')  # Ensure 'punkt' is downloaded before running
    app.run(debug=True)
