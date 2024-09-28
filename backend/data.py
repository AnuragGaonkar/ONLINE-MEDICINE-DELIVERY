from pymongo import MongoClient

# MongoDB connection
client = MongoClient('localhost', 27017)
db = client.medicineDB

# Sample medicine data
medicines = [
    {
        "name": "Dolo650",
        "description": "Dolo650 is a pain reliever and fever reducer.",
        "uses": [
            {"symptom": "headache", "details": "Effective for mild to moderate headaches."},
            {"symptom": "body pain", "details": "Helps relieve body aches and muscle pains."}
        ],
        "dosage": "Take 1-2 tablets every 6 hours as needed."
    },
    {
        "name": "Paracetamol",
        "description": "Paracetamol is used to treat pain and fever.",
        "uses": [
            {"symptom": "headache", "details": "Relieves mild to moderate headaches."}
        ],
        "dosage": "Take 1-2 tablets every 4-6 hours as needed."
    },
    # Add more medicines as needed
]

# Insert data into MongoDB
db.medicines.insert_many(medicines)
print("Medicine data inserted.")
