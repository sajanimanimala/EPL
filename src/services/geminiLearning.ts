// src/services/geminiLearning.ts

const GEMINI_API_KEY = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || "";
const GROQ_API_KEY = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GROQ_API_KEY || "";
const GEMINI_URL = GEMINI_API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`
  : "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY || !GEMINI_URL) {
    throw new Error("Missing VITE_GEMINI_API_KEY in your environment variables.");
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";
  } catch (error) {
    console.error("Gemini request failed:", error);
    throw error;
  }
}

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Missing VITE_GROQ_API_KEY in your environment variables.");
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a helpful educational tutor." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "No response from AI.";
  } catch (error) {
    console.error("Groq request failed:", error);
    throw error;
  }
}

async function callRecallAndTeachAI(prompt: string): Promise<string> {
  if (GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (error) {
      console.warn("Groq failed for learning modes, falling back to Gemini.", error);
    }
  }

  return await callGemini(prompt);
}

// ── Explanation ────────────────────────────────────────────────────────────

async function searchWikiExplanation(topic: string): Promise<string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );
    if (!response.ok) {
      console.error("Wikipedia search failed:", response.status);
      return `I couldn't find a clear explanation for ${topic} right now. Please try a different topic.`;
    }

    const data = await response.json();
    const extract = (data.extract || "").trim();
    if (!extract) {
      return `I couldn't find a clear explanation for ${topic} right now. Please try a different topic.`;
    }

    const sentences: string[] = extract
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .filter((s: string) => s.trim().length > 0);

    const definitionSentence = sentences[0] || `The topic ${topic} is important in its field.`;
    const definition = definitionSentence.replace(/\s*\.$/, "");

    const points = sentences
      .slice(1, 4)
      .map((sentence) => sentence.replace(/\s*\.$/, ""))
      .filter((sentence) => sentence.length > 20);

    const pointText = points.length > 0
      ? `Important points: ${points.join(" ")}`
      : "Important points: This topic includes key ideas and uses that are important to understand.";

    return `Definition: ${definition}. ${pointText}`;
  } catch (error) {
    console.error("Wikipedia explanation failed:", error);
    return `I couldn't find a clear explanation for ${topic} right now. Please try a different topic.`;
  }
}

export async function generateExplanation(topic: string): Promise<string> {
  const prompt = `
You are a patient AI tutor helping a blind student learn completely through audio.

Explain "${topic}" in a long, slow, detailed, beginner-friendly way.

IMPORTANT:

* The explanation must sound natural when spoken aloud using text-to-speech.
* Use very clear and simple language.
* Explain step-by-step slowly.
* Use short sentences for natural pauses in speech.
* Repeat important ideas in different simple ways so the student remembers them.
* Avoid complicated jargon unless you explain it immediately.
* Make the student feel like a real teacher is patiently teaching them.

Structure:

1. Start with a very simple definition.
2. Then explain how it works step-by-step.
3. Explain why it is important.
4. Give multiple real-life examples or analogies.
5. Mention common misunderstandings if relevant.
6. End with a simple recap.

Requirements:

* Minimum 700 words.
* Use conversational teaching style.
* No bullet points.
* No markdown.
* No research papers or citations.
* No overly short paragraphs.
* Each paragraph should focus on one idea clearly.

Speak directly to the student in a calm and understandable way.
`.trim();


  try {
    let response = await callGemini(prompt);

    if (!response || response.length < 120) {
      const retryPrompt = `Your previous answer was too short. Please explain "${topic}" again in a long, simple, easy-to-understand way.
Use plain everyday language and include 2 or 3 simple examples or analogies.
Do not use bullet points or markdown.
Keep it warm, beginner friendly, and detailed enough for a student to understand the topic well.
Previous answer: ${response}`;
      response = await callGemini(retryPrompt);
    }

    if (!/Definition:/i.test(response) || !/Important points:/i.test(response)) {
      return await searchWikiExplanation(topic);
    }

    return response.trim();
  } catch (error) {
    console.error("Explanation generation failed:", error);
    return await searchWikiExplanation(topic);
  }
}

// ── Active Recall ──────────────────────────────────────────────────────────

export interface RecallQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  answer: string;
  explanation?: string;
}

function extractJsonPayload(rawText: string): any {
  const cleaned = rawText.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }

  return JSON.parse(cleaned);
}

function normalizeRecallQuestion(raw: any): RecallQuestion {
  const options = Array.isArray(raw?.options) ? (raw.options as string[]).map(String) : [];
  const explicitAnswer = typeof raw?.correct_answer === "string" ? raw.correct_answer.trim() : "";
  const fallbackAnswer = typeof raw?.answer === "string" ? raw.answer.trim() : "";
  const answerText = explicitAnswer || fallbackAnswer;

  let correctIndex = Number.isInteger(raw?.correctIndex) ? Number(raw.correctIndex) : -1;
  if (correctIndex < 0) {
    correctIndex = options.findIndex((option: string) => option.toLowerCase() === answerText.toLowerCase());
  }
  if (correctIndex < 0 && answerText) {
    correctIndex = options.findIndex((option: string) =>
      option.toLowerCase().includes(answerText.toLowerCase()) ||
      answerText.toLowerCase().includes(option.toLowerCase())
    );
  }
  if (correctIndex < 0) correctIndex = 0;

  return {
    question: typeof raw?.question === "string" ? raw.question : "",
    options,
    correctIndex,
    answer: answerText || options[correctIndex] || "",
    explanation: typeof raw?.explanation === "string" ? raw.explanation : "",
  };
}

export async function generateRecallQuestions(topic: string): Promise<RecallQuestion[]> {
  const prompt = `
You are an expert educational tutor.

Topic: ${topic}

Generate exactly 5 multiple-choice questions that test understanding of the topic.
Rules:
1. Each question must have one correct answer and three plausible distractors.
2. Base every option on the same topic area; avoid vague filler.
3. Make the questions concrete, useful, and directly tied to ${topic}.
4. Return ONLY valid JSON.

Format:
{
  "questions": [
    {
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}
`.trim();

  const fallbackQuestions: RecallQuestion[] = [
    {
      question: `Which statement best defines ${topic}?`,
      options: [
        `A clear explanation of the core idea behind ${topic}`,
        `A random label unrelated to ${topic}`,
        `A detail that only weakly connects to ${topic}`,
        `A mistaken view of what ${topic} means`,
      ],
      correctIndex: 0,
      answer: `A clear explanation of the core idea behind ${topic}`,
    },
    {
      question: `What is one main reason ${topic} matters?`,
      options: [
        `It helps explain how ${topic} works in real situations`,
        `It avoids the main idea of ${topic}`,
        `It replaces ${topic} with an unrelated concept`,
        `It makes ${topic} harder to remember`,
      ],
      correctIndex: 0,
      answer: `It helps explain how ${topic} works in real situations`,
    },
    {
      question: `Which example best shows ${topic} in use?`,
      options: [
        `An application that demonstrates the main function of ${topic}`,
        `A statement that does not relate to ${topic}`,
        `A vague description of something else`,
        `A misconception about the role of ${topic}`,
      ],
      correctIndex: 0,
      answer: `An application that demonstrates the main function of ${topic}`,
    },
    {
      question: `What is a common misconception about ${topic}?`,
      options: [
        `Thinking ${topic} is only a label instead of a real concept`,
        `Recognizing that ${topic} has a clear mechanism`,
        `Understanding that ${topic} applies in real scenarios`,
        `Knowing that ${topic} is tied to core principles`,
      ],
      correctIndex: 0,
      answer: `Thinking ${topic} is only a label instead of a real concept`,
    },
    {
      question: `Why should you review ${topic}?`,
      options: [
        `To strengthen recall of the main idea and use of ${topic}`,
        `To ignore the central mechanism behind ${topic}`,
        `To replace ${topic} with a vague alternative`,
        `To forget what makes ${topic} important`,
      ],
      correctIndex: 0,
      answer: `To strengthen recall of the main idea and use of ${topic}`,
    },
  ];

  try {
    const raw = await callRecallAndTeachAI(prompt);
    const parsed = extractJsonPayload(raw);
    const questions = Array.isArray(parsed) ? parsed : parsed?.questions ?? [];
    return questions.map(normalizeRecallQuestion).slice(0, 5);
  } catch (error) {
    console.error("Recall question generation failed:", error);
    return fallbackQuestions;
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
  try {
    return await callRecallAndTeachAI(prompt);
  } catch (error) {
    console.error("Recall answer evaluation failed:", error);
    return "I couldn't evaluate your answer right now. Please try again later.";
  }
}

// ── Teach Me Back ──────────────────────────────────────────────────────────

export async function evaluateTeachBack(
  topic: string,
  studentExplanation: string
): Promise<string> {
  const prompt = `
A blind student was asked to explain "${topic}" back in their own words.
They said: "${studentExplanation}"
Evaluate whether the explanation is relevant to the topic.
If it is relevant and useful, give warm positive feedback, mention one strong point, and suggest one small improvement.
If it is off-topic, vague, or not about "${topic}", say that clearly and tell the student to open Explanation Mode for deeper understanding of "${topic}".
Reply in 2–3 short sentences, no bullet points, no markdown, no special characters, and speak directly to the student.
  `.trim();
  try {
    return await callRecallAndTeachAI(prompt);
  } catch (error) {
    console.error("Teach-back evaluation failed:", error);
    return "I couldn't evaluate that explanation right now. Please try again later.";
  }
}

function trim() {
  throw new Error("Function not implemented.");
}
