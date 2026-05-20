// src/app/components/modes/TeachMeBackMode.tsx

import { Mic, Users } from "lucide-react";
import { TeachState, Status } from "../../../../hooks/useLearningMode";
import { PageHeader, StatusBar, VoiceButton, InfoCard } from "../shared/Voiceui";

interface TeachMeBackModeProps {
  state: TeachState;
  status: Status;
  onStart: () => void;
  onRecord: () => void;
  onBack: () => void;
}

export default function TeachMeBackMode({
  state,
  status,
  onStart,
  onRecord,
  onBack,
}: TeachMeBackModeProps) {
  const isBusy = status !== "idle" && status !== "error";

  return (
    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">

        <PageHeader title="Teach Me Back" onBack={onBack} />

        <StatusBar status={status} />

        {!state.topic ? (
          <>
            <p
              className="text-[20px] text-white/70 leading-relaxed"
              style={{ fontFamily: "Neuton, serif" }}
            >
              The best way to learn is to teach. Pick a topic, explain it back
              to me in your own words, and I'll give you personalised feedback.
            </p>

            <VoiceButton
              label="Choose Topic"
              icon={<Users size={32} />}
              onClick={onStart}
              disabled={isBusy}
              variant="primary"
              ariaLabel="Choose a topic to teach back"
            />
          </>
        ) : (
          <>
            <InfoCard title="Your Topic" body={state.topic} highlight />

            <p
              className="text-[20px] text-white/70 leading-relaxed"
              style={{ fontFamily: "Neuton, serif" }}
            >
              Explain {state.topic} as if teaching someone from scratch.
              Press Record when ready.
            </p>

            <VoiceButton
              label="Record Explanation"
              icon={<Mic size={32} />}
              onClick={onRecord}
              disabled={isBusy}
              variant="primary"
              ariaLabel="Record your explanation of the topic"
            />

            {state.feedback && (
              <InfoCard title="AI Feedback" body={state.feedback} />
            )}

            {!isBusy && (
              <VoiceButton
                label="Try Another Topic"
                icon={<Users size={32} />}
                onClick={onStart}
                disabled={isBusy}
                variant="outline"
                ariaLabel="Try teaching a different topic"
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}