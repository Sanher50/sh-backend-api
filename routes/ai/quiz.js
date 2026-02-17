import express from "express";
import { generateQuiz } from "../../services/ai.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { topic, level = "beginner", count = 8 } = req.body;

    const data = await generateQuiz({ topic, level, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /quiz error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
