/**
 * SH BACKEND API — CLEAN FOUNDATION (OpenAI Connected)
 * API Keys • SQLite • AI Chat (OpenAI)
 *
 * Endpoints:
 *  GET  /                     -> "OK"
 *  GET  /health               -> { ok: true }
 *  GET  /api/status
 *  POST /api/register          { "name": "...", "email": "..." }
 *  POST /api/ai/chat           Header: x-api-key: <key>
 *                              Body: { "message": "Hello" } OR { "messages": [{role,content}, ...] }
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const crypto = require("crypto");
const { Sequelize, DataTypes } = require("sequelize");

dotenv.config();

const app = express();

// ===============================
// ✅ MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ✅ Railway/Load balancer health routes
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.json({ ok: true }));

// ✅ Node 18+ / Railway has global fetch
const fetchFn = global.fetch;

// ===============================
// ⚙️ CONFIG
// ===============================
const PORT = process.env.PORT || 4000;
const DAILY_LIMIT_FREE = 50;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️ OPENAI_API_KEY is missing. /api/ai/chat will fail until you set it in Railway Variables."
  );
}

// ===============================
// 🗄️ DATABASE (SQLite)
// ===============================
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

// ===============================
// 👤 USER MODEL
// ===============================
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  apiKey: { type: DataTypes.STRING, unique: true },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastResetAt: { type: DataTypes.DATE },
});

// ===============================
// 🔐 HELPERS
// ===============================
function generateApiKey() {
  return crypto.randomBytes(24).toString("hex");
}

function resetUsageIfNewDay(user) {
  const now = new Date();
  const last = user.lastResetAt || new Date(0);
  if (now.toDateString() !== last.toDateString()) {
    user.usageCount = 0;
    user.lastResetAt = now;
  }
}

// ===============================
// 🛡️ API KEY AUTH MIDDLEWARE
// Header: x-api-key: <key>
// ===============================
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      statusCode: 401,
      message: "Missing API key (send header: x-api-key)",
    });
  }

  const user = await User.findOne({ where: { apiKey } });
  if (!user) {
    return res.status(401).json({
      statusCode: 401,
      message: "Invalid API key",
    });
  }

  resetUsageIfNewDay(user);

  if (user.usageCount >= DAILY_LIMIT_FREE) {
    return res.status(429).json({
      statusCode: 429,
      message: "Daily usage limit reached",
      usage: { usedToday: user.usageCount, limit: DAILY_LIMIT_FREE },
    });
  }

  user.usageCount += 1;
  await user.save();

  req.user = user;
  next();
}

// ===============================
// 🩺 STATUS
// ===============================
app.get("/api/status", (req, res) => {
  res.json({
    statusCode: 200,
    service: "sh-backend-api",
    uptimeSeconds: process.uptime(),
  });
});

// ===============================
// 📝 REGISTER USER (GET API KEY)
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        statusCode: 400,
        message: "Name and email are required",
      });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        statusCode: 409,
        message: "User exists",
      });
    }

    const apiKey = generateApiKey();

    const user = await User.create({
      name,
      email,
      apiKey,
      lastResetAt: new Date(),
    });

    res.status(201).json({
      statusCode: 201,
      message: "User registered",
      apiKey: user.apiKey,
    });
  } catch (err) {
    res.status(500).json({
      statusCode: 500,
      error: err.message,
    });
  }
});

// ===============================
// 🤖 AI CHAT (OPENAI)
// Endpoint: POST /api/ai/chat
// Headers: x-api-key: <your_api_key_from_/api/register>
// Body: { "message": "Hello" } OR { "messages": [{role,content}, ...] }
// ===============================
app.post("/api/ai/chat", authenticateApiKey, async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        statusCode: 500,
        message: "Server missing OPENAI_API_KEY (set it in Railway Variables)",
      });
    }

    const { message, messages } = req.body;

    const userMessages = Array.isArray(messages)
      ? messages
      : message
      ? [{ role: "user", content: message }]
      : [];

    if (userMessages.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Provide 'message' or 'messages' in request body",
      });
    }

    const SYSTEM_PROMPT =
      "You are SH Assistant AI. Be friendly, clear, and practical. Explain step-by-step and ask at most one helpful follow-up question when needed.";

    const payload = {
      model: OPENAI_MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...userMessages],
    };

    const r = await fetchFn("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({
        statusCode: 500,
        message: "OpenAI request failed",
        error: data,
      });
    }

    const reply = data?.choices?.[0]?.message?.content || "No reply.";

    res.json({
      statusCode: 200,
      reply,
      usage: { usedToday: req.user.usageCount, limit: DAILY_LIMIT_FREE },
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      statusCode: 500,
      message: "Server error",
      error: err.message,
    });
  }
});

// ===============================
// ❌ 404
// ===============================
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "Endpoint not found",
  });
});

// ===============================
// 🚀 START SERVER (IMPORTANT FOR RAILWAY)
// Start listening FIRST, then sync DB in background
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ server running on ${PORT}`);
});

sequelize
  .sync()
  .then(() => console.log("✅ Database synced"))
  .catch((err) => console.error("❌ DB sync failed:", err));
