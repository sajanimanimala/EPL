// src/services/geminiLearning.ts
// Replace YOUR_GEMINI_API_KEY with your actual key.

const GEMINI_API_KEY = "AIzaSyDQxs9r1Kq23gHmLuyCmLzBTnFOPGSX-";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
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
You are a tutor for a blind student using a voice assistant.
Start with the word "Definition:" followed by a single sentence defining "${topic}".
Then continue with the words "Important points:" and list two or three key points in one or two sentences.
Do not reference papers or quote research. No bullet points, no markdown, no special characters.
  `.trim();

  try {
    let response = await callGemini(prompt);

    if (!/Definition:/i.test(response) || !/Important points:/i.test(response)) {
      const retryPrompt = `Your previous answer did not follow the required format. Reply again using exactly the format below:
Definition: <one sentence defining ${topic}>
Important points: <two or three key points in sentence form>
Do not include bullet points, markdown, or special characters.
Topic: ${topic}
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
}

export async function generateRecallQuestions(topic: string): Promise<RecallQuestion[]> {
  const prompt = `
Generate exactly 5 short multiple-choice recall questions about "${topic}" for a blind student.
Each question must test understanding of the topic, such as what it does, why it matters, or how it works.
Do not ask for the topic name or ask "What is the topic?".
Return ONLY valid JSON with no markdown or code blocks.
Each question must include exactly four answer options and one correct index.
Format:
[
  {"question":"...","options":["...","...","...","..."],"correctIndex":0,"answer":"..."},
  ...
]
Do not include letters or bullet points in the options.
  `.trim();

  const fallbackQuestions: RecallQuestion[] = [
    {
      question: `Which statement best describes why ${topic} is important?`,
      options: [`It helps explain important ideas related to ${topic}`, `It is only a label`, `It has nothing to do with learning`, `It is an unrelated detail`],
      correctIndex: 0,
      answer: `It helps explain important ideas related to ${topic}`,
    },
    {
      question: `What should you remember about ${topic}?`,
      options: [`It is the main concept being studied`, `It is not connected to the quiz`, `It is a random fact`, `It is always wrong`],
      correctIndex: 0,
      answer: `It is the main concept being studied`,
    },
    {
      question: `Which option describes what ${topic} is used for?`,
      options: [`To understand the ideas behind ${topic}`, `To ignore the concept`, `To make something unrelated`, `To remember a random term`],
      correctIndex: 0,
      answer: `To understand the ideas behind ${topic}`,
    },
    {
      question: `What kind of idea does ${topic} involve?`,
      options: [`An important idea connected to the main topic`, `A question about a different subject`, `A detail that is not useful`, `A phrase with no meaning`],
      correctIndex: 0,
      answer: `An important idea connected to the main topic`,
    },
    {
      question: `Why is it useful to review ${topic}?`,
      options: [`Because it helps you learn the key points of the topic`, `Because it is unrelated`, `Because it is easy to forget a name`, `Because it is only a word`],
      correctIndex: 0,
      answer: `Because it helps you learn the key points of the topic`,
    },
  ];

  try {
    const raw = await callGemini(prompt);
    const clean = raw.replace(/```json|```/gi, "").trim();
    return JSON.parse(clean) as RecallQuestion[];
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
    return await callGemini(prompt);
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
In 2–3 sentences, give warm, specific feedback on what they understood well,
what was missing or incorrect, and one thing to remember.
No bullet points, no markdown, no special characters. Speak directly to the student.
  `.trim();
  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error("Teach-back evaluation failed:", error);
    return "I couldn't evaluate that explanation right now. Please try again later.";
  }
}