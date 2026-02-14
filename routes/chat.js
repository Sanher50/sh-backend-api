const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const { authenticateApiKey } = require("../server-auth");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// POST /api/ai/chat  (protected)
router.post("/chat", authenticateApiKey, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        statusCode: 400,
        message: "Message is required",
      });
    }

    if (!openai) {
      return res.status(500).json({
        statusCode: 500,
        message: "OPENAI_API_KEY missing in Railway Variables",
      });
    }

    const SYSTEM_PROMPT =
      "You are SH Assistant AI. Be friendly, calm, and practical. Explain step-by-step.";

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content || "No reply.";

    return res.status(200).json({
      statusCode: 200,
      reply,
      usage: {
        usedToday: req.user.usageCount,
        limit: Number(process.env.DAILY_LIMIT || 50),
      },
      user: {
        name: req.user.name,
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return res.status(500).json({
      statusCode: 500,
      message: "Chat error",
      details: err.message,
    });
  }
});

module.exports = router;


