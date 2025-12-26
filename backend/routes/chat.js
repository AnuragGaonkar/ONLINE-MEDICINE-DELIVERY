// routes/chat.js
const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const getUser = require("../middleware/getUser");

// Utility: decide session id
function resolveSessionId(req) {
  // if frontend explicitly sends one, use it (for future guest support)
  if (req.header("X-Session-Id")) {
    return req.header("X-Session-Id");
  }
  // otherwise, from JWT user
  return req.user?.id;
}

/**
 * GET /api/chat/history
 * Returns full ordered history for the logged-in user (session).
 * Response: [{ text, from }]
 */
router.get("/history", getUser, async (req, res) => {
  try {
    const sessionId = resolveSessionId(req);
    if (!sessionId) {
      return res.status(400).json({ message: "Missing session id" });
    }

    const docs = await Chat.find({ session_id: sessionId })
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

/**
 * POST /api/chat
 * Body expected from Flask (or directly from React if you move NLP):
 * {
 *   user_message: string,
 *   bot_message: string,
 *   medicines?: string[],
 *   quantities?: object,
 *   session_id?: string   // optional override; default = logged-in user id
 * }
 */
router.post("/", getUser, async (req, res) => {
  try {
    const {
      user_message,
      bot_message,
      medicines = [],
      quantities = {},
      session_id,
    } = req.body;

    if (!user_message || !bot_message) {
      return res
        .status(400)
        .json({ message: "user_message and bot_message required" });
    }

    const sessionId = session_id || resolveSessionId(req);
    if (!sessionId) {
      return res.status(400).json({ message: "Missing session id" });
    }

    const doc = await Chat.create({
      session_id: sessionId,
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
