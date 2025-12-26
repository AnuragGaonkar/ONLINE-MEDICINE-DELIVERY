const mongoose = require("mongoose");
require("dotenv").config();  
const mongoURI = process.env.MONGO_URI; // Add your database name

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully.");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
};

module.exports = connectToMongo;
