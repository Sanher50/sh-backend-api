import express from "express";
import { simulateInterview } from "../../services/ai.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      role = "AI engineer",
      experience = "1 year CS student",
      topics = ["data structures", "ml basics"],
      difficulty = "medium",
    } = req.body;

    const data = await simulateInterview({ role, experience, topics, difficulty });
    res.json(data);
  } catch (err) {
    console.error("❌ /interview-simulator error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
