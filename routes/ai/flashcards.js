import express from "express";
import { generateFlashcards } from "../../services/ai.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { notes, count = 12 } = req.body;

    const data = await generateFlashcards({ notes, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /flashcards error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
