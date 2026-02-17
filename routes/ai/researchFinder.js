import express from "express";
import { findResearch } from "../../services/ai.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;

    const data = await findResearch({ topic, count });
    res.json(data);
  } catch (err) {
    console.error("❌ /research-finder error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
