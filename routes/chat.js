const express = require("express");
const router = express.Router();

router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      statusCode: 400,
      message: "Message is required"
    });
  }

  const reply = `Hi 👋 You said: "${message}"`;

  res.json({
    statusCode: 200,
    reply
  });
});

module.exports = router;

