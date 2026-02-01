const User = require("../models/User");

async function auth(req, res, next) {
  const token = req.headers["x-auth-token"];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const user = await User.findOne({ where: { authToken: token } });
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
}

module.exports = auth;
