// src/hooks/useLearningMode.ts
// Fully voice-driven. No button presses required for navigation.
// UI exists only as visual feedback for partially sighted users.
// Every action is triggered by listening to and parsing the user's speech.

import { useState, useCallback, useRef, Dispatch, SetStateAction } from "react";
import { speak } from "../services/speech/textToSpeech";
import { recordAndSendAudio } from "../services/speech/speechToText";
import {
  generateExplanation,
  generateRecallQuestions,
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
  score: number;
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

function isGoBackCommand(speech: string) {
  const s = speech.toLowerCase();
  return (
    s.includes("go back") ||
    s.includes("mode selection") ||
    s.includes("back to mode selection") ||
    s.includes("exit") ||
    s.includes("leave")
  );
}

function exitToModeSelection(onBack?: () => void, setStatus?: Dispatch<SetStateAction<Status>>, isRunning?: React.MutableRefObject<boolean>) {
  if (setStatus) setStatus("idle");
  if (isRunning) isRunning.current = false;
  if (onBack) onBack();
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useLearningMode(onBack?: () => void) {
  const [subMode, setSubMode]   = useState<SubMode>("main");
  const [status,  setStatus]    = useState<Status>("idle");
  const isRunning               = useRef(false);
  const onBackRef               = useRef(onBack);
  const exitRequestedRef        = useRef(false);

  const [explanationState, setExplanationState] = useState<ExplanationState>({
    topic: "",
    explanation: "",
  });

  const [recallState, setRecallState] = useState<RecallState>({
    topic: "",
    questions: [],
    currentIndex: 0,
    feedback: "",
    score: 0,
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

  async function listen(durationMs = 4000): Promise<string> {
    setStatus("listening");
    const result = await recordAndSendAudio(durationMs);
    return (result ?? "").trim().toLowerCase();
  }

  // ── Sub-mode flows ─────────────────────────────────────────────────────

  async function runExplanationFlow() {
    setSubMode("explanation");
    setExplanationState({ topic: "", explanation: "" });

    await say("Explanation Mode. Say the topic you want to learn about, or say go back to return to mode selection.");

    const topic = await listen();
    if (isGoBackCommand(topic)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

    if (!topic) {
      await say("I didn't catch that. Say the topic you want to learn about.");
      const retry = await listen();
      if (isGoBackCommand(retry)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
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
    if (isGoBackCommand(choice)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

    if (choice.includes("again") || choice.includes("repeat")) {
      await say(explanation);
      await runExplanationPostMenu(topic, explanation);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runExplanationFlow();
    } else if (detectSubMode(choice) === "recall") {
      await runRecallFlow();
    } else if (detectSubMode(choice) === "teach") {
      await runTeachFlow();
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
    if (isGoBackCommand(choice)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

    if (choice.includes("again") || choice.includes("repeat")) {
      await say(explanation);
      await runExplanationPostMenu(topic, explanation);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runExplanationFlow();
    } else if (detectSubMode(choice) === "recall") {
      await runRecallFlow();
    } else if (detectSubMode(choice) === "teach") {
      await runTeachFlow();
    } else {
      await runMainMenu();
    }
  }

  // ── Active Recall flow ─────────────────────────────────────────────────

  async function runRecallFlow() {
    setSubMode("recall");
    setRecallState({ topic: "", questions: [], currentIndex: 0, feedback: "", score: 0, isComplete: false });

    await say("Active Recall. Say the topic you want to be quizzed on.");

    const topic = await listen();
    if (isGoBackCommand(topic)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }
    if (!topic) {
      await say("I didn't catch that. Say the topic you want to be quizzed on.");
      const retry = await listen();
      if (isGoBackCommand(retry)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
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
    await say(`Generating five multiple-choice questions about ${topic}. Please wait.`);

    setStatus("processing");
    const questions = await generateRecallQuestions(topic);
    setRecallState({ topic, questions, currentIndex: 0, feedback: "", score: 0, isComplete: false });

    await say(`Ready. I have ${questions.length} questions for you about ${topic}.`);
    await runRecallQuestion(topic, questions, 0, 0);
  }

  function parseOptionSelection(answer: string, options: string[]): number {
    const normalized = answer.trim().toLowerCase();
    if (!normalized) return -1;

    const normalizedTokens = normalized.replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    const joined = normalizedTokens.join(" ");
    const letterMap: Record<string, number> = {
      a: 0,
      b: 1,
      c: 2,
      d: 3,
      "option a": 0,
      "option b": 1,
      "option c": 2,
      "option d": 3,
      "choice a": 0,
      "choice b": 1,
      "choice c": 2,
      "choice d": 3,
      first: 0,
      second: 1,
      third: 2,
      fourth: 3,
      one: 0,
      two: 1,
      three: 2,
      four: 3,
    };

    const directIndex = letterMap[joined] ?? letterMap[normalizedTokens[0] ?? ""];
    if (directIndex !== undefined && options[directIndex]) return directIndex;

    const lastToken = normalizedTokens[normalizedTokens.length - 1] ?? "";
    const lastTokenIndex = letterMap[lastToken];
    if (lastTokenIndex !== undefined && options[lastTokenIndex]) return lastTokenIndex;

    const ordinalToken = normalizedTokens.find((token) => letterMap[token] !== undefined);
    if (ordinalToken && options[letterMap[ordinalToken] ?? -1]) {
      return letterMap[ordinalToken] ?? -1;
    }

    for (let index = 0; index < options.length; index++) {
      const optionText = options[index].toLowerCase().replace(/[^a-z0-9 ]/g, " ");
      if (joined === optionText || joined.includes(optionText) || optionText.includes(joined)) {
        return index;
      }
    }

    return -1;
  }

  async function runRecallQuestion(
    topic: string,
    questions: RecallQuestion[],
    index: number,
    currentScore: number
  ) {
    setRecallState((prev) => ({ ...prev, currentIndex: index, feedback: "", score: currentScore }));

    const question = questions[index];
    await say(`Question ${index + 1} of ${questions.length}: ${question.question}`);
    await say(`Option A: ${question.options[0]}. Option B: ${question.options[1]}. Option C: ${question.options[2]}. Option D: ${question.options[3]}.`);
    await say("If you want me to repeat the question, say repeat. Otherwise say the letter of your choice or the answer option.");

    let answer = await listen();
    if (isGoBackCommand(answer)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

    if (answer.includes("repeat")) {
      await say(`Question ${index + 1} of ${questions.length}: ${question.question}`);
      await say(`Option A: ${question.options[0]}. Option B: ${question.options[1]}. Option C: ${question.options[2]}. Option D: ${question.options[3]}.`);
      await say("Now say the letter of your choice, or say the answer option.");
      answer = await listen();
      if (isGoBackCommand(answer)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
    }

    let selectedIndex = parseOptionSelection(answer, question.options);
    if (selectedIndex === -1) {
      await say("I didn't understand that answer. Please say A, B, C, or D.");
      answer = await listen();
      if (isGoBackCommand(answer)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
      if (answer.includes("repeat")) {
        await say(`Question ${index + 1} of ${questions.length}: ${question.question}`);
        await say(`Option A: ${question.options[0]}. Option B: ${question.options[1]}. Option C: ${question.options[2]}. Option D: ${question.options[3]}.`);
        await say("Now say the letter of your choice, or say the answer option.");
        answer = await listen();
        if (isGoBackCommand(answer)) {
          exitRequestedRef.current = true;
          exitToModeSelection(onBackRef.current, setStatus, isRunning);
          return;
        }
      }
      selectedIndex = parseOptionSelection(answer, question.options);
    }

    if (selectedIndex === -1) {
      await say("I still couldn't understand the choice. I'll move to the next question.");
      selectedIndex = -1;
    }

    const isCorrect = selectedIndex === question.correctIndex;
    const chosenText = selectedIndex >= 0 ? question.options[selectedIndex] : "your selection";
    const correctText = question.options[question.correctIndex];
    const feedback = isCorrect
      ? `Correct. The right answer is ${correctText}.`
      : `Not quite. The correct answer is ${correctText}.`;

    const nextScore = isCorrect ? currentScore + 1 : currentScore;
    setRecallState((prev) => ({ ...prev, feedback, score: nextScore }));
    await say(feedback);

    const nextIndex = index + 1;
    if (nextIndex < questions.length) {
      await delay(500);
      await runRecallQuestion(topic, questions, nextIndex, nextScore);
    } else {
      setRecallState((prev) => ({ ...prev, isComplete: true, score: nextScore }));
      await say(
        `You have completed all ${questions.length} questions on ${topic}. ` +
        `You answered ${nextScore} out of ${questions.length} correctly. Great work! ` +
        "Say 'again' to redo this quiz, 'new topic' for a different topic, or 'go back' to return to mode selection."
      );
      const choice = await listen();
      if (isGoBackCommand(choice)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
      if (choice.includes("again") || choice.includes("redo")) {
        await runRecallForTopic(topic);
      } else if (choice.includes("new") || choice.includes("topic")) {
        await runRecallFlow();
      } else if (detectSubMode(choice) === "explanation") {
        await runExplanationFlow();
      } else if (detectSubMode(choice) === "teach") {
        await runTeachFlow();
      } else {
        await runMainMenu();
      }
    }
  }

  // ── Teach Me Back flow ─────────────────────────────────────────────────

  async function runTeachFlow() {
    setSubMode("teach");
    setTeachState({ topic: "", feedback: "" });

    await say("Teach Me Back. What is the topic you want to teach?");

    const topic = await listen();
    if (isGoBackCommand(topic)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }
    if (!topic) {
      await say("I didn't catch that. Say the topic you want to teach.");
      const retry = await listen();
      if (isGoBackCommand(retry)) {
        exitRequestedRef.current = true;
        exitToModeSelection(onBackRef.current, setStatus, isRunning);
        return;
      }
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
      "Please summarize or explain it in your own words for up to two minutes. " +
      "Speak now, and I will tell you whether your explanation is relevant to the topic."
    );

    const studentExplanation = await listen(120000);
    if (isGoBackCommand(studentExplanation)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

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
    if (isGoBackCommand(choice)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }
    if (choice.includes("again") || choice.includes("retry")) {
      await runTeachForTopic(topic);
    } else if (choice.includes("new") || choice.includes("topic")) {
      await runTeachFlow();
    } else if (detectSubMode(choice) === "explanation") {
      await runExplanationFlow();
    } else if (detectSubMode(choice) === "recall") {
      await runRecallFlow();
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
    if (isGoBackCommand(choice)) {
      exitRequestedRef.current = true;
      exitToModeSelection(onBackRef.current, setStatus, isRunning);
      return;
    }

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
    exitRequestedRef.current = false;
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