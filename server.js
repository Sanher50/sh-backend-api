/**
 * SH BACKEND API — STABLE (Railway + OpenAI)
 *
 * Public endpoint for frontend (NO API KEY):
 *  POST /api/public/chat
 *
 * Protected endpoint (reserved for future):
 *  POST /api/ai/chat
 *
 * Health:
 *  GET /        -> OK
 *  GET /health  -> { ok: true }
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(express.json());

// ===== CONFIG =====
const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// IMPORTANT: set this later to your frontend domain for extra security.
// For now it can be "*"
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// ===== CORS =====
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  })
);

// ===== Health =====
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.json({ ok: true }));

// ===== OpenAI client (safe) =====
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ===== Simple rate limit for public endpoint =====
const WINDOW_MS = 60_000;
const MAX_REQ = 25;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count += 1;
  hits.set(ip, entry);

  if (entry.count > MAX_REQ) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  next();
}

// ===== PUBLIC CHAT (frontend uses this) =====
app.post("/api/public/chat", rateLimit, async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: "OPENAI_API_KEY missing in Railway Variables"
      });
    }

    const { message, messages } = req.body || {};

    const userMessages = Array.isArray(messages)
      ? messages
      : message
      ? [{ role: "user", content: message }]
      : [];

    if (!userMessages.length) {
      return res.status(400).json({ error: "Provide message or messages" });
    }

    const SYSTEM_PROMPT =
      "You are SH Assistant AI. Be friendly, clear, and practical. Explain step-by-step.";
console.log("➡️ Sending to OpenAI:", userMessages);

const completion = await openai.chat.completions.create({
  model: OPENAI_MODEL,
  messages: [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages],
});

console.log("✅ OpenAI response received");

    const reply = completion?.choices?.[0]?.message?.content || "No reply.";

    return res.json({ reply });
  } catch (err) {
    console.error("Public chat error:", err);
    return res.status(500).json({ error: "Chat error", details: err.message });
  }
});

// ===== PROTECTED CHAT (reserved for future) =====
app.post("/api/ai/chat", async (req, res) => {
  return res.status(401).json({
    error: "This endpoint is protected. Use /api/public/chat for frontend."
  });
});

// ===== 404 =====
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// ===== Prevent crashes =====
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ server running on port ${PORT}`);
});

