/**
 * SH BACKEND API — FINAL STABLE VERSION
 * Railway + OpenAI (SDK v4+)
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();

/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(express.json());

/* -------------------- Health Checks -------------------- */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

/* -------------------- OpenAI Client -------------------- */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------- Test AI Route -------------------- */
app.post("/api/ai/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY not set on server",
      });
    }

    const message = req.body.message || "Say hello";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* -------------------- Start Server -------------------- */
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
