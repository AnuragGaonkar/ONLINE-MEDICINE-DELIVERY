from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk
import re

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/medicineDB"  # Adjust your MongoDB URI
mongo = PyMongo(app)

# Tokenization function
def tokenize(text):
    words = nltk.word_tokenize(text.lower())
    words = [word for word in words if word.isalnum()]
    return words

# Function to find relevant medicines
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
                'score': score
            })

    # Sort by score in descending order and return top 5
    medicine_scores.sort(key=lambda x: x['score'], reverse=True)
    return medicine_scores[:5]

# Function to handle default responses for common greetings or general queries
def get_default_response(message):
    greetings = ['hello', 'hi', 'hey', 'howdy', 'greetings']
    # Check if the message is a greeting
    if any(greeting in message.lower() for greeting in greetings):
        return "Hello! How can I assist you today?"
    return None  # No default response, continue to find medicines

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')

    # Check for a default response first
    default_response = get_default_response(user_message)
    if default_response:
        return jsonify({'message': default_response, 'medicines': []})

    # Tokenize user message to extract symptoms
    tokens = tokenize(user_message)
    medicines = find_medicines(tokens)

    if medicines:
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

if __name__ == '__main__':
    app.run(debug=True)
