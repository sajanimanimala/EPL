// src/hooks/useLearningMode.ts

import { useState, useCallback } from "react";
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
export type Status = "idle" | "speaking" | "listening" | "processing" | "error";

export interface ExplanationState {
  topic: string;
  explanation: string;
}

export interface RecallState {
  topic: string;
  questions: RecallQuestion[];
  currentIndex: number;
  feedback: string;
}

export interface TeachState {
  topic: string;
  feedback: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useLearningMode() {
  const [subMode, setSubMode] = useState<SubMode>("main");
  const [status, setStatus] = useState<Status>("idle");

  const [explanationState, setExplanationState] = useState<ExplanationState>({
    topic: "",
    explanation: "",
  });

  const [recallState, setRecallState] = useState<RecallState>({
    topic: "",
    questions: [],
    currentIndex: 0,
    feedback: "",
  });

  const [teachState, setTeachState] = useState<TeachState>({
    topic: "",
    feedback: "",
  });

  // ── Shared helper ──────────────────────────────────────────────────────

  async function listenForTopic(): Promise<string> {
    setStatus("speaking");
    await speak("What topic would you like?");
    setStatus("listening");
    const topic = await recordAndSendAudio();
    return topic.trim();
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  const goToMode = useCallback((mode: SubMode) => {
    setStatus("idle");
    setSubMode(mode);
    if (mode === "explanation") speak("Explanation Mode. Press Speak Topic to begin.");
    else if (mode === "recall")  speak("Active Recall. Press Start to begin.");
    else if (mode === "teach")   speak("Teach Me Back. Press Start to begin.");
  }, []);

  const goToMain = useCallback(() => {
    setStatus("idle");
    setSubMode("main");
  }, []);

  // ── Explanation flow ───────────────────────────────────────────────────

  const startExplanation = useCallback(async () => {
    try {
      const topic = await listenForTopic();
      if (!topic) return;

      setExplanationState({ topic, explanation: "" });
      setStatus("processing");

      const explanation = await generateExplanation(topic);

      setExplanationState({ topic, explanation });
      setStatus("speaking");
      await speak(explanation);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Something went wrong. Please try again.");
    }
  }, []);

  const replayExplanation = useCallback(() => {
    if (explanationState.explanation) speak(explanationState.explanation);
  }, [explanationState.explanation]);

  // ── Active Recall flow ─────────────────────────────────────────────────

  const startRecall = useCallback(async () => {
    try {
      const topic = await listenForTopic();
      if (!topic) return;

      setRecallState({ topic, questions: [], currentIndex: 0, feedback: "" });
      setStatus("processing");

      await speak(`Great! I'll ask you 3 questions about ${topic}.`);

      const questions = await generateRecallQuestions(topic);

      setRecallState({ topic, questions, currentIndex: 0, feedback: "" });
      setStatus("speaking");
      await speak(questions[0].question);
      setStatus("listening");
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Something went wrong. Please try again.");
    }
  }, []);

  const answerRecallQuestion = useCallback(async () => {
    const { questions, currentIndex, topic } = recallState;
    if (!questions.length) return;

    try {
      setStatus("listening");
      const answer = await recordAndSendAudio();

      setStatus("processing");
      const current = questions[currentIndex];
      const feedback = await evaluateRecallAnswer(current.question, current.answer, answer);

      setRecallState((prev) => ({ ...prev, feedback }));
      setStatus("speaking");
      await speak(feedback);

      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        setRecallState((prev) => ({ ...prev, currentIndex: nextIndex, feedback: "" }));
        await speak(`Question ${nextIndex + 1}: ${questions[nextIndex].question}`);
        setStatus("listening");
      } else {
        await speak(`You've completed all 3 questions on ${topic}. Well done!`);
        setStatus("idle");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Something went wrong. Please try again.");
    }
  }, [recallState]);

  // ── Teach Me Back flow ─────────────────────────────────────────────────

  const startTeachBack = useCallback(async () => {
    try {
      const topic = await listenForTopic();
      if (!topic) return;

      setTeachState({ topic, feedback: "" });
      setStatus("speaking");

      await speak(
        `Now explain ${topic} back to me in your own words, as if you're teaching someone. Press Record when ready.`
      );
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Something went wrong. Please try again.");
    }
  }, []);

  const recordTeachBack = useCallback(async () => {
    const { topic } = teachState;
    if (!topic) return;

    try {
      setStatus("listening");
      const studentExplanation = await recordAndSendAudio();

      setStatus("processing");
      const feedback = await evaluateTeachBack(topic, studentExplanation);

      setTeachState((prev) => ({ ...prev, feedback }));
      setStatus("speaking");
      await speak(feedback);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      speak("Something went wrong. Please try again.");
    }
  }, [teachState]);

  // ── Exposed API ────────────────────────────────────────────────────────

  return {
    subMode,
    status,
    explanationState,
    recallState,
    teachState,
    goToMode,
    goToMain,
    startExplanation,
    replayExplanation,
    startRecall,
    answerRecallQuestion,
    startTeachBack,
    recordTeachBack,
  };
}