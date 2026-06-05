// src/app/components/LearningMode.tsx
//
// This component is VISUAL FEEDBACK ONLY for partially sighted users.
// All navigation is driven by voice in useLearningMode.
// useEffect starts the voice loop on mount — no buttons needed.

import { useEffect } from "react";
import { useLearningMode } from "../../hooks/useLearningMode";
import { StatusBar } from "./shared/Voiceui";

interface LearningModeProps {
  onBack: () => void;
}

// Labels shown on screen so partially sighted users can see current state
const MODE_LABELS = {
  main:        "Learning Mode",
  explanation: "Explanation Mode",
  recall:      "Active Recall",
  teach:       "Teach Me Back",
};

export default function LearningMode({ onBack }: LearningModeProps) {
  const {
    subMode,
    status,
    explanationState,
    recallState,
    teachState,
    startLearningMode,
  } = useLearningMode(onBack);

  // Start voice loop as soon as component mounts
  useEffect(() => {
    startLearningMode();
  }, []);

  return (
    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

        {/* ── Mode heading ── */}
        <h1
          className="text-[48px] font-bold text-center"
          style={{ fontFamily: "Neuton, serif" }}
        >
          {MODE_LABELS[subMode]}
        </h1>

        {/* ── Voice status ── */}
        <StatusBar status={status} />

        {/* ── Context card — shows what's happening ── */}
        <ContextCard
          subMode={subMode}
          status={status}
          explanationState={explanationState}
          recallState={recallState}
          teachState={teachState}
        />

      </div>
    </div>
  );
}

// ── ContextCard ────────────────────────────────────────────────────────────
// Shows relevant content for partially sighted users.
// Changes automatically as voice flow progresses.

import { SubMode, Status, ExplanationState, RecallState, TeachState } from "../../hooks/useLearningMode";

interface ContextCardProps {
  subMode:          SubMode;
  status:           Status;
  explanationState: ExplanationState;
  recallState:      RecallState;
  teachState:       TeachState;
}

function ContextCard({
  subMode,
  status,
  explanationState,
  recallState,
  teachState,
}: ContextCardProps) {

  // ── Main menu ──
  if (subMode === "main") {
    return (
      <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-6 flex flex-col gap-4">
        <p className="text-[20px] text-white/70" style={{ fontFamily: "Neuton, serif" }}>
          Say the mode you want to enter:
        </p>
        {[
          { label: "Explanation",    desc: "Learn about any topic" },
          { label: "Active Recall",  desc: "Answer questions on a topic" },
          { label: "Teach Me Back",  desc: "Explain a topic in your own words" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-center gap-4 py-2 border-b border-white/10 last:border-0">
            <div>
              <p className="text-[22px] font-bold text-white" style={{ fontFamily: "Neuton, serif" }}>
                {label}
              </p>
              <p className="text-[16px] text-white/50" style={{ fontFamily: "Neuton, serif" }}>
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Explanation mode ──
  if (subMode === "explanation") {
    return (
      <div className="flex flex-col gap-4">
        {explanationState.topic && (
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-6">
            <p className="text-[16px] text-[#FFD700]/70 uppercase tracking-widest mb-2"
               style={{ fontFamily: "Neuton, serif" }}>Topic</p>
            <p className="text-[24px] font-bold text-white" style={{ fontFamily: "Neuton, serif" }}>
              {explanationState.topic}
            </p>
          </div>
        )}
        {explanationState.explanation && (
          <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-xl p-6">
            <p className="text-[16px] text-white/50 uppercase tracking-widest mb-2"
               style={{ fontFamily: "Neuton, serif" }}>Explanation</p>
            <p className="text-[20px] leading-relaxed text-white/90" style={{ fontFamily: "Neuton, serif" }}>
              {explanationState.explanation}
            </p>
          </div>
        )}
        {!explanationState.topic && (
          <Prompt text="Say your topic now" active={status === "listening"} />
        )}
      </div>
    );
  }

  // ── Active Recall mode ──
  if (subMode === "recall") {
    const current = recallState.questions[recallState.currentIndex];
    return (
      <div className="flex flex-col gap-4">
        {recallState.topic && (
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-4">
            <p className="text-[16px] text-[#FFD700]/70 uppercase tracking-widest"
               style={{ fontFamily: "Neuton, serif" }}>
              Topic: {recallState.topic}
            </p>
          </div>
        )}
        {current && !recallState.isComplete && (
          <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-[16px] text-white/50 uppercase tracking-widest mb-2"
                 style={{ fontFamily: "Neuton, serif" }}>
                Question {recallState.currentIndex + 1} of {recallState.questions.length}
              </p>
              <p className="text-[22px] font-bold text-white leading-snug"
                 style={{ fontFamily: "Neuton, serif" }}>
                {current.question}
              </p>
            </div>
            <div className="grid gap-3">
              {current.options.map((option, idx) => (
                <div key={option} className="bg-black/80 border border-white/10 rounded-xl p-4">
                  <p className="text-[18px] text-[#FFD700] font-semibold" style={{ fontFamily: "Neuton, serif" }}>
                    {String.fromCharCode(65 + idx)}.
                  </p>
                  <p className="text-[18px] text-white leading-relaxed" style={{ fontFamily: "Neuton, serif" }}>
                    {option}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {recallState.feedback && (
          <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-xl p-6">
            <p className="text-[16px] text-white/50 uppercase tracking-widest mb-2"
               style={{ fontFamily: "Neuton, serif" }}>Feedback</p>
            <p className="text-[20px] text-white/90 leading-relaxed"
               style={{ fontFamily: "Neuton, serif" }}>
              {recallState.feedback}
            </p>
          </div>
        )}
        {recallState.isComplete && (
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-6">
            <p className="text-[22px] font-bold text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
              Quiz Complete!
            </p>
            <p className="text-[18px] mt-3 text-white/80" style={{ fontFamily: "Neuton, serif" }}>
              Score: {recallState.score} out of {recallState.questions.length}
            </p>
          </div>
        )}
        {!recallState.topic && (
          <Prompt text="Say your topic now" active={status === "listening"} />
        )}
      </div>
    );
  }

  // ── Teach Me Back mode ──
  if (subMode === "teach") {
    return (
      <div className="flex flex-col gap-4">
        {teachState.topic && (
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-6">
            <p className="text-[16px] text-[#FFD700]/70 uppercase tracking-widest mb-2"
               style={{ fontFamily: "Neuton, serif" }}>Your Topic</p>
            <p className="text-[24px] font-bold text-white" style={{ fontFamily: "Neuton, serif" }}>
              {teachState.topic}
            </p>
          </div>
        )}
        {teachState.feedback && (
          <div className="bg-[#1a1a1a] border-2 border-white/20 rounded-xl p-6">
            <p className="text-[16px] text-white/50 uppercase tracking-widest mb-2"
               style={{ fontFamily: "Neuton, serif" }}>AI Feedback</p>
            <p className="text-[20px] text-white/90 leading-relaxed"
               style={{ fontFamily: "Neuton, serif" }}>
              {teachState.feedback}
            </p>
          </div>
        )}
        {!teachState.topic && (
          <Prompt text="Say your topic now" active={status === "listening"} />
        )}
      </div>
    );
  }

  return null;
}

// ── Prompt ─────────────────────────────────────────────────────────────────

function Prompt({ text, active }: { text: string; active: boolean }) {
  return (
    <div
      className={`
        flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all
        ${active
          ? "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
          : "border-white/20 text-white/40"
        }
      `}
    >
      <div className={`w-3 h-3 rounded-full ${active ? "bg-[#FFD700] animate-pulse" : "bg-white/20"}`} />
      <span className="text-[18px]" style={{ fontFamily: "Neuton, serif" }}>{text}</span>
    </div>
  );
}