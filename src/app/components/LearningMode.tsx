// src/app/components/LearningMode.tsx

import { MessageSquare, Brain, Users, ArrowLeft } from "lucide-react";
import { useLearningMode } from "../../hooks/useLearningMode";
import ExplanationMode from "./modes/ExplanationMode";
import ActiveRecallMode from "./modes/ActiveRecallMode";
import TeachMeBackMode from "./modes/TeachMeBackMode";
import { VoiceButton } from "./shared/Voiceui";

interface LearningModeProps {
  onBack: () => void;
}

export default function LearningMode({ onBack }: LearningModeProps) {
  const {
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
  } = useLearningMode();

  if (subMode === "explanation") {
    return (
      <ExplanationMode
        state={explanationState}
        status={status}
        onSpeak={startExplanation}
        onReplay={replayExplanation}
        onBack={goToMain}
      />
    );
  }

  if (subMode === "recall") {
    return (
      <ActiveRecallMode
        state={recallState}
        status={status}
        onStart={startRecall}
        onAnswer={answerRecallQuestion}
        onBack={goToMain}
      />
    );
  }

  if (subMode === "teach") {
    return (
      <TeachMeBackMode
        state={teachState}
        status={status}
        onStart={startTeachBack}
        onRecord={recordTeachBack}
        onBack={goToMain}
      />
    );
  }

  // ── Main menu ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

        <h1
          className="text-[48px] font-bold text-center text-white"
          style={{ fontFamily: "Neuton, serif" }}
        >
          Learning Mode
        </h1>

        <VoiceButton
          label="Explanation Mode"
          icon={<MessageSquare size={32} />}
          onClick={() => goToMode("explanation")}
          variant="secondary"
          ariaLabel="Open Explanation Mode — learn about any topic"
        />

        <VoiceButton
          label="Active Recall"
          icon={<Brain size={32} />}
          onClick={() => goToMode("recall")}
          variant="secondary"
          ariaLabel="Open Active Recall — answer questions on a topic"
        />

        <VoiceButton
          label="Teach Me Back"
          icon={<Users size={32} />}
          onClick={() => goToMode("teach")}
          variant="secondary"
          ariaLabel="Open Teach Me Back — explain a topic in your own words"
        />

        <VoiceButton
          label="Back to Mode Selection"
          icon={<ArrowLeft size={24} />}
          onClick={onBack}
          variant="outline"
          ariaLabel="Go back to mode selection"
        />

      </div>
    </div>
  );
}