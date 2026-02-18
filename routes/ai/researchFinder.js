const express = require("express");
const { findResearch } = require("../../services/ai.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { topic, count = 5 } = req.body || {};
    const data = await findResearch({ topic, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /ai/research-finder error:", err);
    res.status(400).json({ error: err.message || "Research failed" });
  }
});

module.exports = router;
