// src/app/components/modes/ExplanationMode.tsx

import { Mic, Volume2 } from "lucide-react";
import { ExplanationState, Status } from "../../../../hooks/useLearningMode";
import { PageHeader, StatusBar, VoiceButton, InfoCard } from "../shared/Voiceui";

interface ExplanationModeProps {
  state: ExplanationState;
  status: Status;
  onSpeak: () => void;
  onReplay: () => void;
  onBack: () => void;
}

export default function ExplanationMode({
  state,
  status,
  onSpeak,
  onReplay,
  onBack,
}: ExplanationModeProps) {
  const isBusy = status !== "idle" && status !== "error";

  return (
    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

        <PageHeader title="Explanation Mode" onBack={onBack} />

        <StatusBar status={status} />

        <VoiceButton
          label="Speak Topic"
          icon={<Mic size={32} />}
          onClick={onSpeak}
          disabled={isBusy}
          variant="primary"
          ariaLabel="Speak your topic to get an explanation"
        />

        {state.topic && (
          <InfoCard title="Topic" body={state.topic} highlight />
        )}

        <InfoCard
          title="Explanation"
          body={state.explanation || "Your explanation will appear here after you speak a topic."}
        />

        {state.explanation && (
          <VoiceButton
            label="Replay Explanation"
            icon={<Volume2 size={32} />}
            onClick={onReplay}
            disabled={status === "speaking"}
            variant="secondary"
            ariaLabel="Replay the explanation audio"
          />
        )}

      </div>
    </div>
  );
}