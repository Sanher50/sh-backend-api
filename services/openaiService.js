const OpenAI = require("openai");

const apiKey = (process.env.OPENAI_API_KEY || "").trim();
const client = apiKey ? new OpenAI({ apiKey }) : null;

async function chatJSON({ system, user, temperature = 0.6 }) {
  if (!client) throw new Error("OPENAI_API_KEY missing in environment");

  const resp = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature,
  });

  const text = resp.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Model returned invalid JSON");
  }
}

module.exports = { chatJSON };
