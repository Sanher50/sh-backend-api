import chatRoutes from "./routes/chat.js";

/**
 * SH BACKEND API — CLEAN FOUNDATION
 * API Keys • SQLite • AI Chat (Mock)
 * Built to be extended later (OpenAI, monetization, mobile apps)
 */

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const crypto = require("crypto");
const { Sequelize, DataTypes } = require("sequelize");

dotenv.config();

const app = express();

// ✅ THIS IS THE FIX
app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRoutes);



// ===============================
// ⚙️ CONFIG
// ===============================
const PORT = process.env.PORT || 4000;
const DAILY_LIMIT_FREE = 50;

// ===============================
// 🗄️ DATABASE (SQLite)
// ===============================
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false
});

// ===============================
// 👤 USER MODEL
// ===============================
const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    unique: true
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastResetAt: {
    type: DataTypes.DATE
  }
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
// ===============================
async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      statusCode: 401,
      message: "Missing API key"
    });
  }

  const user = await User.findOne({ where: { apiKey } });

  if (!user) {
    return res.status(401).json({
      statusCode: 401,
      message: "Invalid API key"
    });
  }

  resetUsageIfNewDay(user);

  if (user.usageCount >= DAILY_LIMIT_FREE) {
    return res.status(429).json({
      statusCode: 429,
      message: "Daily usage limit reached"
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
    uptimeSeconds: process.uptime()
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
        message: "Name and email are required"
      });
    }

    if (await User.findOne({ where: { email } })) {
      return res.status(409).json({
        statusCode: 409,
        message: "User already exists"
      });
    }

    const apiKey = generateApiKey();

    const user = await User.create({
      name,
      email,
      apiKey,
      lastResetAt: new Date()
    });

    res.status(201).json({
      statusCode: 201,
      message: "User registered",
      apiKey: user.apiKey
    });

  } catch (err) {
    res.status(500).json({
      statusCode: 500,
      error: err.message
    });
  }
});

// ===============================
// 🤖 AI CHAT (MOCK — WORKING)
// ===============================
app.post("/api/ai/chat", authenticateApiKey, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      statusCode: 400,
      message: "Message is required"
    });
  }

  // Mock AI response (replace later with OpenAI / local model)
  const reply = `Hi ${req.user.name} 👋 You said: "${message}"`;

  res.json({
    statusCode: 200,
    reply,
    usage: {
      usedToday: req.user.usageCount,
      limit: DAILY_LIMIT_FREE
    }
  });
});

// ===============================
// ❌ 404
// ===============================
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "Endpoint not found"
  });
});

// ===============================
// 🚀 START SERVER
// ===============================
(async () => {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`✅ SH Backend API running on http://localhost:${PORT}`);
  });
})();
