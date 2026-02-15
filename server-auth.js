// server-auth.js
function authenticateApiKey(req, res, next) {
  const key = req.headers["x-sh-api-key"];

  if (!process.env.SH_API_KEY) {
    return res.status(500).json({ error: "SH_API_KEY missing on server" });
  }

  if (!key || key !== process.env.SH_API_KEY) {
    return res.status(401).json({ error: "Invalid SH API key" });
  }

  next();
}

module.exports = { authenticateApiKey };
