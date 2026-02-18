const express = require("express");
const { generateFlashcards } = require("../../services/ai.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { notes, count = 12 } = req.body || {};
    const data = await generateFlashcards({ notes, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /ai/flashcards error:", err);
    res.status(400).json({ error: err.message || "Flashcards failed" });
  }
});

module.exports = router;
