const express = require("express");
const { explainCode } = require("../../services/ai.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { code, language = "javascript", focus = "" } = req.body || {};
    const data = await explainCode({ code, language, focus });
    res.json(data);
  } catch (err) {
    console.error("❌ /ai/code-explainer error:", err);
    res.status(400).json({ error: err.message || "Code explain failed" });
  }
});

module.exports = router;
