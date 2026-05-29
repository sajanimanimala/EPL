// src/hooks/useLearningMode.ts
// Fully voice-driven. No button presses required for navigation.
// UI exists only as visual feedback for partially sighted users.
// Every action is triggered by listening to and parsing the user's speech.

import { useState, useCallback, useRef } from "react";
import { speak } from "../services/speech/textToSpeech";
import { recordAndSendAudio } from "../services/speech/speechToText";
import {
  generateExplanation,
  generateRecallQuestions,
  evaluateRecallAnswer,
  evaluateTeachBack,
  RecallQuestion,
} from "../services/geminiLearning";

// ── Types ──────────────────────────────────────────────────────────────────

export type SubMode = "main" | "explanation" | "recall" | "teach";
export type Status  = "idle" | "speaking" | "listening" | "processing" | "error";

export interface ExplanationState {
  topic: string;
  explanation: string;
}

export interface RecallState {
  topic: string;
  questions: RecallQuestion[];
  currentIndex: number;
  feedback: string;
  isComplete: boolean;
}

export interface TeachState {
  topic: string;
  feedback: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function detectSubMode(speech: string): SubMode | null {
  const s = speech.toLowerCase();
  if (s.includes("explanation") || s.includes("explain"))    return "explanation";
  if (s.includes("recall") || s.includes("quiz"))            return "recall";
  if (s.includes("teach") || s.includes("teach me"))         return "teach";
  return null;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useLearningMode() {
  const [subMode, setSubMode]   = useState<SubMode>("main");
  const [status,  setStatus]    = useState<Status>("idle");
  const isRunning               = useRef(false);

  const [explanationState, setExplanationState] = useState<ExplanationState>({
    topic: "",
    explanation: "",
  });

  const [recallState, setRecallState] = useState<RecallState>({
    topic: "",
    questions: [],
    currentIndex: 0,
    feedback: "",
    isComplete: false,
  });

  const [teachState, setTeachState] = useState<TeachState>({
    topic: "",
    feedback: "",
  });

  // ── Primitives ─────────────────────────────────────────────────────────

  async function say(text: string) {
    setStatus("speaking");
    await speak(text);
    await delay(300);
  }

  async function listen(): Promise<string> {
    setStatus("listening");
    const result = await recordAndSendAudio();
    return (result ?? "").trim().toLowerCase();
  }

  // ── Sub-mode flows ─────────────────────────────────────────────────────

  async function runExplanationFlow() {
    setSubMode("explanation");
    setExplanationState({ topic: "", explanation: "" });

    await say("Explanation Mode. Say the topic you want to learn about.");

    const topic = await listen();

    if (!topic) {
      await say("I didn't catch that. Say the topic you want to learn about.");
      const retry = await listen();
      if (!retry) {
        await say("Still couldn't hear you. Returning to the main menu.");
        await runMainMenu();
        return;
      }
      await runExplanationForTopic(retry);
    } else {
      await runExplanationForTopic(topic);
    }
  }

  async function runExplanationForTopic(topic: string) {
    await say(`Got it. Generating an explanation for ${topic}. Please wait.`);

    setStatus("processing");
    const explanation = await generateExplanation(topic);
    setExplanationState({ topic, explanation });

    await say(explanation);

    await say(
      "That was your explanation. " +
      "Say 'again' to hear it once more, " +
      "'menu' to go back to the learning menu, " +
      "or 'new topic' to learn something else."
    );

    const choice = await listen();

    if (choice.includes("again") || choice.includes("repeat")) {
      await say(explanation);
      await runExplanationPostMenu(topic, explanation);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runExplanationFlow();
    } else {
      await runMainMenu();
    }
  }

  async function runExplanationPostMenu(topic: string, explanation: string) {
    await say(
      "Say 'again' to hear it once more, " +
      "'new topic' to learn something else, " +
      "or 'menu' to go back."
    );
    const choice = await listen();
    if (choice.includes("again") || choice.includes("repeat")) {
      await say(explanation);
      await runExplanationPostMenu(topic, explanation);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runExplanationFlow();
    } else {
      await runMainMenu();
    }
  }

  // ── Active Recall flow ─────────────────────────────────────────────────

  async function runRecallFlow() {
    setSubMode("recall");
    setRecallState({ topic: "", questions: [], currentIndex: 0, feedback: "", isComplete: false });

    await say("Active Recall. Say the topic you want to be quizzed on.");

    const topic = await listen();
    if (!topic) {
      await say("I didn't catch that. Say the topic you want to be quizzed on.");
      const retry = await listen();
      if (!retry) {
        await say("Still couldn't hear you. Returning to the main menu.");
        await runMainMenu();
        return;
      }
      await runRecallForTopic(retry);
    } else {
      await runRecallForTopic(topic);
    }
  }

  async function runRecallForTopic(topic: string) {
    await say(`Generating three questions about ${topic}. Please wait.`);

    setStatus("processing");
    const questions = await generateRecallQuestions(topic);
    setRecallState({ topic, questions, currentIndex: 0, feedback: "", isComplete: false });

    await say(`Ready. I have three questions for you about ${topic}.`);
    await runRecallQuestion(topic, questions, 0);
  }

  async function runRecallQuestion(
    topic: string,
    questions: RecallQuestion[],
    index: number
  ) {
    setRecallState((prev) => ({ ...prev, currentIndex: index, feedback: "" }));

    await say(`Question ${index + 1} of ${questions.length}: ${questions[index].question}`);
    await say("Speak your answer now.");

    const answer = await listen();

    await say("Checking your answer.");
    setStatus("processing");

    const feedback = await evaluateRecallAnswer(
      questions[index].question,
      questions[index].answer,
      answer
    );

    setRecallState((prev) => ({ ...prev, feedback }));
    await say(feedback);

    const nextIndex = index + 1;
    if (nextIndex < questions.length) {
      await delay(500);
      await runRecallQuestion(topic, questions, nextIndex);
    } else {
      setRecallState((prev) => ({ ...prev, isComplete: true }));
      await say(
        `You have completed all three questions on ${topic}. Well done! ` +
        "Say 'again' to redo this quiz, 'new topic' for a different topic, or 'menu' to go back."
      );
      const choice = await listen();
      if (choice.includes("again") || choice.includes("redo")) {
        await runRecallForTopic(topic);
      } else if (choice.includes("new") || choice.includes("topic")) {
        await runRecallFlow();
      } else {
        await runMainMenu();
      }
    }
  }

  // ── Teach Me Back flow ─────────────────────────────────────────────────

  async function runTeachFlow() {
    setSubMode("teach");
    setTeachState({ topic: "", feedback: "" });

    await say("Teach Me Back. Say the topic you want to teach.");

    const topic = await listen();
    if (!topic) {
      await say("I didn't catch that. Say the topic you want to teach.");
      const retry = await listen();
      if (!retry) {
        await say("Still couldn't hear you. Returning to the main menu.");
        await runMainMenu();
        return;
      }
      await runTeachForTopic(retry);
    } else {
      await runTeachForTopic(topic);
    }
  }

  async function runTeachForTopic(topic: string) {
    setTeachState({ topic, feedback: "" });

    await say(
      `Your topic is ${topic}. ` +
      "Explain it back to me in your own words, as if you're teaching someone " +
      "who has never heard of it. Speak now, you have about four seconds."
    );

    const studentExplanation = await listen();

    await say("Analysing your explanation. Please wait.");
    setStatus("processing");

    const feedback = await evaluateTeachBack(topic, studentExplanation);
    setTeachState({ topic, feedback });

    await say(feedback);

    await say(
      "Say 'again' to try the same topic again, " +
      "'new topic' to choose a different one, or 'menu' to go back."
    );

    const choice = await listen();
    if (choice.includes("again") || choice.includes("retry")) {
      await runTeachForTopic(topic);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runTeachFlow();
    } else {
      await runMainMenu();
    }
  }

  // ── Main menu ──────────────────────────────────────────────────────────

  async function runMainMenu() {
    setSubMode("main");

    await say(
      "Learning Mode. Which mode would you like? " +
      "Say 'explanation' to learn about a topic, " +
      "'recall' to test yourself with questions, " +
      "or 'teach me back' to explain a topic in your own words."
    );

    const choice = await listen();
    const detected = detectSubMode(choice);

    if (detected === "explanation") {
      await runExplanationFlow();
    } else if (detected === "recall") {
      await runRecallFlow();
    } else if (detected === "teach") {
      await runTeachFlow();
    } else {
      await say(
        "I didn't catch that. Please say 'explanation', 'recall', or 'teach me back'."
      );
      await runMainMenu();
    }
  }

  // ── Entry point — called once on mount ────────────────────────────────

  const startLearningMode = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    try {
      await runMainMenu();
    } finally {
      isRunning.current = false;
      setStatus("idle");
    }
  }, []);

  // ── Exposed API ────────────────────────────────────────────────────────

  return {
    subMode,
    status,
    explanationState,
    recallState,
    teachState,
    startLearningMode,
  };
}