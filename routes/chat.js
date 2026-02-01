const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    // TEMP response (proves plumbing works)
    return res.json({
      status: "ok",
      reply: `SH Assistant received: ${message}`
    });

  } catch (err) {
    console.error("Chat route error:", err);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

module.exports = router;


