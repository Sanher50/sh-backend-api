import { chatJSON } from "./openaiService.js";

export async function generateQuiz({ topic, level = "beginner", count = 8 }) {
  if (!topic) throw new Error("Missing 'topic'");

  const system = `
You generate a multiple-choice quiz for a CS student.
Return STRICT JSON with keys: topic, level, questions.
questions is an array of objects:
{ "question": string, "options": string[4], "answer_index": number(0-3), "explanation": string }
No extra keys.
`;

  const user = `Topic: ${topic}\nLevel: ${level}\nCount: ${count}`;
  return chatJSON({ system, user, temperature: 0.6 });
}

export async function generateFlashcards({ notes, count = 12 }) {
  if (!notes) throw new Error("Missing 'notes'");

  const system = `
Create study flashcards from notes.
Return STRICT JSON with keys: cards, schedule.
cards is an array of { "front": string, "back": string, "tags": string[] }.
schedule is a short study suggestion.
No extra keys.
`;

  const user = `Make ${count} flashcards from these notes:\n${notes}`;
  return chatJSON({ system, user, temperature: 0.5 });
}

export async function explainCode({ code, language = "javascript", focus = "" }) {
  if (!code) throw new Error("Missing 'code'");

  const system = `
You are an expert code tutor.
Return STRICT JSON with keys:
{ "summary": string, "step_by_step": string[], "complexity": string, "improvements": string[] }
No extra keys.
`;

  const user =
    `Language: ${language}\n` +
    (focus ? `Focus: ${focus}\n` : "") +
    `Explain this code:\n\n${code}`;

  return chatJSON({ system, user, temperature: 0.6 });
}

export async function findResearch({ topic, count = 5 }) {
  if (!topic) throw new Error("Missing 'topic'");

  const system = `
You produce a short research reading list.
Return STRICT JSON with keys: top_papers, summary.
top_papers is an array of:
{ "title": string, "authors": string, "year": string, "url": string, "why_it_matters": string }
If unsure about exact URLs, use arXiv / Semantic Scholar search URLs.
No extra keys.
`;

  const user = `Topic: ${topic}\nCount: ${count}`;
  return chatJSON({ system, user, temperature: 0.4 });
}

export async function simulateInterview({
  role = "AI engineer",
  experience = "1 year CS student",
  topics = ["data structures", "ml basics"],
  difficulty = "medium",
}) {
  const system = `
You are a technical interviewer.
Return STRICT JSON with keys: questions, follow_ups, feedback_rubric.
questions: 6-10 items
follow_ups: 6-10 items
feedback_rubric: 6-10 items
No extra keys.
`;

  const user =
    `Role: ${role}\n` +
    `Experience: ${experience}\n` +
    `Difficulty: ${difficulty}\n` +
    `Topics: ${(topics || []).join(", ")}`;

  return chatJSON({ system, user, temperature: 0.6 });
}

