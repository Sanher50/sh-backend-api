// server-auth.js

// Put this in Railway Variables:
// API_KEYS=key1:Sandra,key2:TestUser

const RAW_KEYS = process.env.API_KEYS || "";

// Build users map
const USERS = new Map();

RAW_KEYS.split(",")
  .map((v) => v.trim())
  .filter(Boolean)
  .forEach((pair) => {
    const [key, name] = pair.split(":");
    USERS.set(key, {
      name: name || "User",
      usageCount: 0,
    });
  });

function authenticateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing x-api-key header" });
  }

  const user = USERS.get(apiKey);
  if (!user) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  user.usageCount += 1;
  req.user = user;

  next();
}

module.exports = { authenticateApiKey };

