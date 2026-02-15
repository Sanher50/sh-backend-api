/**
 * SH BACKEND API — FINAL STABLE VERSION (CLEAN)
 * Platform: Railway
 *
 * Public endpoint (frontend / testing):
 *  POST /api/public/chat   (requires x-sh-api-key)
 *
 * Debug:
 *  GET  /health
 *  GET  /debug/whoami
 *  GET  /debug/routes
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const SH_API_KEY = process.env.SH_API_KEY;

// Build identifier
const BUILD_TAG =
  process.env.RAILWAY_GIT_COMMIT_SHA || `local-${Date.now()}`;

// ===============================
// CORS
// ===============================
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-sh-api-key", "x-api-key"],
  })
);

// ===============================
// MIDDLEWARE: SH API KEY
// ===============================
function requireShApiKey(req, res, next) {
  const key = req.headers["x-sh-api-key"];
  if (!SH_API_KEY) {
    return res.status(500).json({ error: "SH_API_KEY missing on server", build: BUILD_TAG });
  }
  if (!key || key !== SH_API_KEY) {
    return res.status(401).json({ error: "Invalid SH API key", build: BUILD_TAG });
  }
  next();
}

// ===============================
// SIMPLE RATE LIMIT
// ===============================
const WINDOW_MS = 60_000; // 1 minute
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
    return res
      .status(429)
      .json({ error: "Too many requests. Try again in a minute.", build: BUILD_TAG });
  }

  next();
}

// ===============================
// OPENAI CLIENT
// ===============================
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing in environment (local .env or Railway variables)");
}
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ===============================
// HEALTH & DEBUG
// ===============================
app.get("/", (req, res) => res.send("OK"));

app.get("/health", (req, res) => {
  res.json({ ok: true, build: BUILD_TAG });
});

app.get("/debug/whoami", (req, res) => {
  res.json({
    running: "server.js",
    build: BUILD_TAG,
    port: PORT,
    hasOpenAIKey: Boolean(OPENAI_API_KEY),
    hasShApiKey: Boolean(SH_API_KEY),
    model: OPENAI_MODEL,
    ip:
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown",
  });
});

// ✅ This is the route you asked to add
app.get("/debug/routes", (req, res) => {
  const routes = [];

  // Express keeps routes in internal stacks (app._router.stack)
  const stack = app._router?.stack || [];
  for (const m of stack) {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).map((x) => x.toUpperCase());
      routes.push({ path: m.route.path, methods });
    }
  }

  res.json({ routes, build: BUILD_TAG });
});

// ===============================
// PUBLIC CHAT (FRONTEND / TESTING)
// Requires: x-sh-api-key
// ===============================
app.post("/api/public/chat", requireShApiKey, rateLimit, async (req, res) => {
  try {
    // Ping mode (no OpenAI call)
    if (req.query.ping === "1") {
      return res.json({ reply: "pong", build: BUILD_TAG });
    }

    if (!openai) {
      return res.status(500).json({
        error: "OPENAI_API_KEY missing in environment",
        build: BUILD_TAG,
      });
    }

    const { message, messages } = req.body || {};

    const userMessages = Array.isArray(messages)
      ? messages
      : message
      ? [{ role: "user", content: String(message) }]
      : [];

    if (!userMessages.length) {
      return res.status(400).json({
        error: "Provide 'message' or 'messages'",
        build: BUILD_TAG,
      });
    }

    const SYSTEM_PROMPT =
      "You are SH Assistant AI. Be friendly, calm, and practical. Explain step-by-step.";

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages],
    });

    const reply = completion?.choices?.[0]?.message?.content || "No reply.";
    return res.json({ reply, build: BUILD_TAG });
  } catch (err) {
    console.error("Public chat error:", err);
    return res.status(500).json({
      error: "Chat error",
      details: err?.message || String(err),
      build: BUILD_TAG,
    });
  }
});

// ===============================
// 404 (LAST)
// ===============================
app.use((req, res) =>
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
    build: BUILD_TAG,
  })
);

// ===============================
// SAFETY
// ===============================
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

// ===============================
// START
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ server running on port ${PORT} | build ${BUILD_TAG}`);
});
