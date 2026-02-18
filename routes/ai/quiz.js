const express = require("express");
const { generateQuiz } = require("../../services/ai.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { topic, level = "beginner", count = 8 } = req.body || {};
    const data = await generateQuiz({ topic, level, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /ai/quiz error:", err);
    res.status(400).json({ error: err.message || "Quiz failed" });
  }
});

module.exports = router;
