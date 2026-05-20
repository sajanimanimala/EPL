// src/app/components/modes/ActiveRecallMode.tsx

import { Mic, Brain } from "lucide-react";
import { RecallState, Status } from "../../../../hooks/useLearningMode";
import { PageHeader, StatusBar, VoiceButton, InfoCard } from "../shared/Voiceui";

interface ActiveRecallModeProps {
  state: RecallState;
  status: Status;
  onStart: () => void;
  onAnswer: () => void;
  onBack: () => void;
}

export default function ActiveRecallMode({
  state,
  status,
  onStart,
  onAnswer,
  onBack,
}: ActiveRecallModeProps) {
  const isBusy = status !== "idle" && status !== "error";
  const hasQuestions = state.questions.length > 0;
  const currentQuestion = hasQuestions ? state.questions[state.currentIndex] : null;
  const isFinished = hasQuestions && state.currentIndex >= state.questions.length;

  return (
    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

        <PageHeader title="Active Recall" onBack={onBack} />

        <StatusBar status={status} />

        {!hasQuestions ? (
          <>
            <p
              className="text-[20px] text-white/70 leading-relaxed"
              style={{ fontFamily: "Neuton, serif" }}
            >
              I'll ask you 3 questions on any topic. Answer each one out loud
              and get instant AI feedback.
            </p>

            <VoiceButton
              label="Start Quiz"
              icon={<Brain size={32} />}
              onClick={onStart}
              disabled={isBusy}
              variant="primary"
              ariaLabel="Start the active recall quiz"
            />
          </>
        ) : isFinished ? (
          <InfoCard
            title="Quiz Complete!"
            body={`You've answered all questions on ${state.topic}. Great work!`}
            highlight
          />
        ) : (
          <>
            {hasQuestions && (
              <div
                className="text-[16px] text-[#FFD700]/70 uppercase tracking-widest"
                style={{ fontFamily: "Neuton, serif" }}
              >
                Question {state.currentIndex + 1} of {state.questions.length} — {state.topic}
              </div>
            )}

            {currentQuestion && (
              <InfoCard title="Question" body={currentQuestion.question} highlight />
            )}

            {state.feedback && (
              <InfoCard title="Feedback" body={state.feedback} />
            )}

            <VoiceButton
              label="Answer"
              icon={<Mic size={32} />}
              onClick={onAnswer}
              disabled={isBusy || status === "listening"}
              variant="primary"
              ariaLabel="Record your answer"
            />
          </>
        )}

      </div>
    </div>
  );
}