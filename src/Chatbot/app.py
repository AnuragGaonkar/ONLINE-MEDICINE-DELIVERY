from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
import nltk

app = Flask(__name__)
CORS(app)

# MongoDB configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/medicineDB"  # Adjust your MongoDB URI
mongo = PyMongo(app)

# Tokenization function
def tokenize(text):
    return nltk.word_tokenize(text.lower())

# Function to find relevant medicines
def find_medicines(symptoms):
    medicines = mongo.db.medicines.find()
    medicine_scores = []

    for medicine in medicines:
        score = 0
        for use in medicine['uses']:
            if use['symptom'] in symptoms:
                score += 1

        if score > 0:
            medicine_scores.append({
                'name': medicine['name'],
                'description': medicine['description'],
                'dosage': medicine['dosage'],
                'score': score
            })

    # Sort by score in descending order
    medicine_scores.sort(key=lambda x: x['score'], reverse=True)
    return medicine_scores

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    
    # Tokenize user message to extract symptoms
    tokens = tokenize(user_message)
    medicines = find_medicines(tokens)

    if medicines:
        response = {
            'medicines': medicines,
            'message': "Here are the recommended medicines for your symptoms."
        }
    else:
        response = {
            'message': "I'm sorry, I couldn't find any medicines for your symptoms."
        }

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)
