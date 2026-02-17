import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ OPENAI_API_KEY is missing. Add it to .env / Railway Variables.");
}

const client = new OpenAI({ apiKey });

export async function chatJSON({
  system,
  user,
  model = process.env.OPENAI_MODEL || "gpt-4.1-mini",
  temperature = 0.6,
}) {
  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature,
  });

  const text = resp.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    // If the model ever returns invalid JSON, surface it clearly
    throw new Error(`Model returned invalid JSON: ${text}`);
  }
}
