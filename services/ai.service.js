async function processMessage({ message, user }) {
  // TEMP mock AI response (IMPORTANT)
  // This guarantees the request will finish
  return {
    reply: `Hello ${user || "there"} 👋 You said: "${message}"`,
    model: "sh-mock-ai",
    timestamp: new Date().toISOString()
  };
}

module.exports = { processMessage };

