/**
 * SH BACKEND API — CLEAN FOUNDATION
 * API Keys • SQLite • AI Chat (Mock)
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const crypto = require("crypto");
const { Sequelize, DataTypes } = require("sequelize");

// ROUTES
const chatRoutes = require("./routes/chat");

dotenv.config();

const app = express();

// ===============================
// ✅ MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// ⚙️ CONFIG
// ===============================
const PORT = process.env.PORT || 8080;
const DAILY_LIMIT_FREE = 50;

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
// 🛡️ API KEY AUTH
// ===============================
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

  user.usageCount++;
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
// 📝 REGISTER
// ===============================
app.post("/api/register", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email required" });
  }

  if (await User.findOne({ where: { email } })) {
    return res.status(409).json({ message: "User exists" });
  }

  const apiKey = generateApiKey();
  const user = await User.create({
    name,
    email,
    apiKey,
    lastResetAt: new Date(),
  });

  res.status(201).json({ apiKey });
});

// ===============================
// 🤖 AI CHAT (PROTECTED)
// ===============================
app.post("/api/ai/chat", authenticateApiKey, (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Message required" });
  }

  res.json({
    reply: `Hi ${req.user.name} 👋 You said: "${message}"`,
    usedToday: req.user.usageCount,
    limit: DAILY_LIMIT_FREE,
  });
});

// ===============================
// 💬 CHAT ROUTES (UNPROTECTED)
// ===============================
app.use("/api/chat", chatRoutes);

// ===============================
// ❌ 404
// ===============================
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// ===============================
// 🚀 START
// ===============================
(async () => {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();

