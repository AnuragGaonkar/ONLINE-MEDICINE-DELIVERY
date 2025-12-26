// models/Chat.js
const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  session_id: { type: String, required: true }, // user id or guest id
  user_message: { type: String, required: true },
  bot_message: { type: String, required: true },
  medicines: { type: [String], default: [] },
  quantities: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", ChatSchema);
