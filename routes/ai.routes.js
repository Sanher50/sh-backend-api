const express = require("express");
const router = express.Router();

const { authenticateApiKey } = require("../server-auth");

// ===============================
// 🤖 AI CHAT (protected)
// ===============================
router.post("/chat", authenticateApiKey, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      statusCode: 400,
      message: "Message is required",
    });
  }

  const reply = `Hi ${req.user.name}, you said: "${message}"`;

  res.status(200).json({
    statusCode: 200,
    reply,
    usage: {
      usedToday: req.user.usageCount,
      limit: 50,
    },
  });
});

module.exports = router;

