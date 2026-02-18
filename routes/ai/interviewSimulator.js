const express = require("express");
const { simulateInterview } = require("../../services/ai.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      role = "AI engineer",
      experience = "1 year CS student",
      topics = ["data structures", "ml basics"],
      difficulty = "medium",
    } = req.body || {};

    const data = await simulateInterview({ role, experience, topics, difficulty });
    res.json(data);
  } catch (err) {
    console.error("❌ /ai/interview-simulator error:", err);
    res.status(400).json({ error: err.message || "Interview failed" });
  }
});

module.exports = router;
