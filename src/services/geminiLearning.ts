// src/services/geminiLearning.ts
// Replace YOUR_GEMINI_API_KEY with your actual key.

const GEMINI_API_KEY = "AIzaSyDQxs9r1Kq23gHmLuyCmLzBTnFOPGSX-";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";
}

// ── Explanation ────────────────────────────────────────────────────────────

export async function generateExplanation(topic: string): Promise<string> {
  const prompt = `
You are a tutor for a blind student using a voice assistant.
Explain "${topic}" in 3–4 clear, conversational sentences.
No bullet points, no markdown, no special characters. Speak as if talking directly to the student.
  `.trim();
  return callGemini(prompt);
}

// ── Active Recall ──────────────────────────────────────────────────────────

export interface RecallQuestion {
  question: string;
  answer: string;
}

export async function generateRecallQuestions(topic: string): Promise<RecallQuestion[]> {
  const prompt = `
Generate exactly 3 short recall questions about "${topic}" for a blind student.
Return ONLY valid JSON with no markdown or code blocks.
Format: [{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}]
  `.trim();

  const raw = await callGemini(prompt);
  const clean = raw.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(clean) as RecallQuestion[];
  } catch {
    return [{ question: `What is the main concept of ${topic}?`, answer: "See explanation for details." }];
  }
}

export async function evaluateRecallAnswer(
  question: string,
  correctAnswer: string,
  studentAnswer: string
): Promise<string> {
  const prompt = `
A blind student answered a recall question using voice.
Question: "${question}"
Correct answer: "${correctAnswer}"
Student answered: "${studentAnswer}"
In 1–2 sentences, say whether they got it right and what they missed if anything.
Be warm and encouraging. No markdown, no special characters.
  `.trim();
  return callGemini(prompt);
}

// ── Teach Me Back ──────────────────────────────────────────────────────────

export async function evaluateTeachBack(
  topic: string,
  studentExplanation: string
): Promise<string> {
  const prompt = `
A blind student was asked to explain "${topic}" back in their own words.
They said: "${studentExplanation}"
In 2–3 sentences, give warm, specific feedback on what they understood well,
what was missing or incorrect, and one thing to remember.
No bullet points, no markdown, no special characters. Speak directly to the student.
  `.trim();
  return callGemini(prompt);
}