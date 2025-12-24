const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// GET /api/chat/history  -> returns [{ text, from }] array for chatbot
router.get("/history", async (req, res) => {
  try {
    const docs = await Chat.find({ session_id: "default-session" })
      .sort({ timestamp: 1 })
      .lean();

    const history = docs
      .map((d) => [
        { text: d.user_message, from: "user" },
        { text: d.bot_message, from: "bot" },
      ])
      .flat();

    return res.json({ history });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    return res.status(500).json({ message: "Failed to load history" });
  }
});

// POST /api/chat  -> save one exchange, called from your chat backend logic
router.post("/", async (req, res) => {
  try {
    const {
      user_message,
      bot_message,
      medicines = [],
      quantities = {},
      session_id = "default-session",
    } = req.body;

    if (!user_message || !bot_message) {
      return res.status(400).json({ message: "user_message and bot_message required" });
    }

    const doc = await Chat.create({
      session_id,
      user_message,
      bot_message,
      medicines,
      quantities,
    });

    return res.json({ saved: true, id: doc._id });
  } catch (err) {
    console.error("Error saving chat:", err);
    return res.status(500).json({ message: "Failed to save chat" });
  }
});

module.exports = router;
