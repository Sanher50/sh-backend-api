/**
 * SH BACKEND API — FINAL STABLE VERSION
 * Railway-ready • OpenAI SDK • SQLite • API Keys
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const OpenAI = require("openai");
const crypto = require("crypto");
const { Sequelize, DataTypes } = require("sequelize");

dotenv.config();

const app = express();

/* ===============================
   ✅ MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   ✅ RAILWAY HEALTH ROUTES
   (THIS FIXES "FAILED TO RESPOND")
================================ */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

/* ===============================
   ⚙️ CONFIG
================================ */
const PORT = process.env.PORT || 4000;
const DAILY_LIMIT_FREE = 50;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is missing");
}

/* ===============================
   🤖 OPENAI CLIENT (SDK — SAFE)
================================ */
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/* ===============================
   🗄️ DATABASE (SQLite)
================================ */
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

/* ===============================
   👤 USER MODEL
================================ */
const User = sequelize.define("User", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  apiKey: { type: DataTypes.STRING, unique: true },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastResetAt: { type: DataTypes.DATE },
});

/* ===============================
   🔐 HELPERS
================================ */
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

/* ===============================
   🛡️ API KEY AUTH
================================ */
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ message: "Missing API key" });
  }

  const user = await User.findOne({ where: { apiKey } });
  if (!user) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  resetUsageIfNewDay(user);

  if (user.usageCount >= DAILY_LIMIT_FREE) {
    return res.status(429).json({ message: "Daily limit reached" });
  }

  user.usageCount += 1;
  await user.save();

  req.user = user;
  next();
}

/* ===============================
   🩺 STATUS
================================ */
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

/* ===============================
   📝 REGISTER USER
================================ */
app.post("/api/register", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const apiKey = generateApiKey();

  const user = await User.create({
    name,
    email,
    apiKey,
    lastResetAt: new Date(),
  });

  res.status(201).json({ apiKey: user.apiKey });
});

/* ===============================
   🤖 AI CHAT (OPENAI SDK)
================================ */
app.post("/api/ai/chat", authenticateApiKey, async (req, res) => {
  try {
    const { message, messages } = req.body;

    const userMessages = Array.isArray(messages)
      ? messages
      : message
      ? [{ role: "user", content: message }]
      : [];

    if (userMessages.length === 0) {
      return res.status(400).json({ message: "Message required" });
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are SH Assistant AI. Be clear, helpful, and step-by-step.",
        },
        ...userMessages,
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({
      reply,
      usage: {
        usedToday: req.user.usageCount,
        limit: DAILY_LIMIT_FREE,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OpenAI error", error: err.message });
  }
});

/* ===============================
   ❌ 404
================================ */
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

/* ===============================
   🚀 START SERVER
================================ */
(async () => {
  await sequelize.sync();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();
