import express from "express";
import { explainCode } from "../../services/ai.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { code, language = "javascript", focus = "" } = req.body;

    const data = await explainCode({ code, language, focus });
    res.json(data);
  } catch (err) {
    console.error("❌ /code-explainer error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
