import {
  ArrowLeft,
  Mic,
  Volume2,
  MessageSquare,
  Brain,
  Users,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { speak } from "../../services/speech/textToSpeech";
import { recordAndSendAudio } from "../../services/speech/speechToText";

interface LearningModeProps {
  onBack: () => void;
}

export default function LearningMode({
  onBack,
}: LearningModeProps) {

  const [subMode, setSubMode] = useState<
    'main' | 'explanation' | 'recall' | 'teach'
  >('main');

  const [isListening, setIsListening] = useState(false);

  const [topic, setTopic] = useState("");

  const [explanation, setExplanation] = useState("");

  const [status, setStatus] = useState("Idle");

  /*
  -----------------------------------------
  EXPLANATION FLOW
  -----------------------------------------
  */

  async function startExplanationFlow() {

    setIsListening(true);

    setStatus("Speaking...");

    speak("What topic would you like to learn?");

    setTimeout(async () => {

      setStatus("Listening...");

      const result = await recordAndSendAudio();

      setTopic(result);

      setStatus("Processing...");

      let generatedExplanation = "";

      if (result.includes("photosynthesis")) {

        generatedExplanation =
          "Photosynthesis is the process by which green plants convert sunlight into energy using chlorophyll.";

      }

      else if (result.includes("ai")) {

        generatedExplanation =
          "Artificial Intelligence is the simulation of human intelligence using machines and software.";

      }

      else if (result.includes("backpropagation")) {

        generatedExplanation =
          "Backpropagation is the process used by neural networks to learn by adjusting weights based on prediction errors.";

      }

      else {

        generatedExplanation =
          `${result} is an important topic. Detailed explanation will appear here.`;

      }

      setExplanation(generatedExplanation);

      setStatus("Speaking...");

      speak(generatedExplanation);

      setIsListening(false);

    }, 3000);
  }

  /*
  -----------------------------------------
  EXPLANATION SCREEN
  -----------------------------------------
  */

  if (subMode === 'explanation') {

    return (

      <div className="flex flex-col h-full px-6 py-8 bg-black text-white">

        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">

          {/* Header */}
          <div className="flex items-center gap-4">

            <button
              onClick={() => setSubMode('main')}
              className="
                p-3
                rounded-lg
                border-2
                border-[#FFD700]
                text-[#FFD700]
                hover:bg-[#FFD700]
                hover:text-black
                transition-colors
              "
            >
              <ArrowLeft size={24} />
            </button>

            <h1
              className="text-[48px] font-bold"
              style={{ fontFamily: 'Neuton, serif' }}
            >
              Explanation Mode
            </h1>

          </div>

          {/* Voice Input */}
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">

            <div className="flex items-center gap-4 mb-6">

              <Mic
                size={32}
                className={
                  isListening
                    ? "text-[#FFD700] animate-pulse"
                    : "text-white"
                }
              />

              <p
                className="text-[22px]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {isListening
                  ? "Listening... Speak your topic"
                  : "Press button to speak topic"}
              </p>

            </div>

            <button
              onClick={startExplanationFlow}
              className="
                w-full
                min-h-[90px]
                bg-[#FFD700]
                text-black
                rounded-lg
                hover:scale-105
                transition-transform
                duration-200
                focus:outline-none
                focus:ring-4
                focus:ring-[#FFD700]
                flex
                items-center
                justify-center
                gap-4
              "
            >
              <Mic size={32} />

              <span
                className="text-[24px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                Speak Topic
              </span>

            </button>

          </div>

          {/* Topic */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-[#FFD700]">

            <h2
              className="text-[28px] font-bold mb-4"
              style={{ fontFamily: 'Neuton, serif' }}
            >
              Topic
            </h2>

            <p
              className="text-[20px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {topic || "No topic detected yet"}
            </p>

          </div>

          {/* Explanation */}
          <div className="bg-[#1a1a1a] rounded-lg p-8 border-2 border-white">

            <h2
              className="text-[28px] font-bold mb-4"
              style={{ fontFamily: 'Neuton, serif' }}
            >
              Explanation
            </h2>

            <p
              className="text-[20px] leading-relaxed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {explanation || "Explanation will appear here"}
            </p>

          </div>

          {/* Replay Audio */}
          <button
            onClick={() => speak(explanation)}
            className="
              w-full
              min-h-[90px]
              bg-white
              text-black
              rounded-lg
              hover:scale-105
              transition-transform
              duration-200
              focus:outline-none
              focus:ring-4
              focus:ring-[#FFD700]
              flex
              items-center
              justify-center
              gap-4
            "
          >
            <Volume2 size={32} />

            <span
              className="text-[24px] font-bold"
              style={{ fontFamily: 'Neuton, serif' }}
            >
              Play Audio
            </span>

          </button>

          {/* Status */}
          <div className="flex items-center justify-center gap-3">

            <Mic size={20} className="text-[#FFD700] animate-pulse" />

            <span
              className="text-[18px] text-[#FFD700]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Status: {status}
            </span>

          </div>

        </div>

      </div>
    );
  }

  /*
  -----------------------------------------
  MAIN LEARNING SCREEN
  -----------------------------------------
  */

  return (

    <div className="flex flex-col h-full px-6 py-8 bg-black text-white">

      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">

        <h1
          className="text-[48px] font-bold text-center"
          style={{ fontFamily: 'Neuton, serif' }}
        >
          Learning Mode
        </h1>

        {/* Explanation */}
        <button
          onClick={() => {
            setSubMode('explanation');

            setTimeout(() => {
              speak("Opening Explanation Mode");
            }, 500);
          }}
          className="
            w-full
            min-h-[90px]
            bg-white
            text-black
            rounded-lg
            hover:scale-105
            transition-transform
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-[#FFD700]
            flex
            items-center
            gap-6
            px-8
          "
        >
          <MessageSquare size={32} />

          <span
            className="text-[24px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Explanation Mode
          </span>

        </button>

        {/* Active Recall */}
        <button
          onClick={() => {
            setSubMode('recall');

            speak("Opening Active Recall");
          }}
          className="
            w-full
            min-h-[90px]
            bg-white
            text-black
            rounded-lg
            hover:scale-105
            transition-transform
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-[#FFD700]
            flex
            items-center
            gap-6
            px-8
          "
        >
          <Brain size={32} />

          <span
            className="text-[24px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Active Recall
          </span>

        </button>

        {/* Teach Me Back */}
        <button
          onClick={() => {
            setSubMode('teach');

            speak("Opening Teach Me Back");
          }}
          className="
            w-full
            min-h-[90px]
            bg-white
            text-black
            rounded-lg
            hover:scale-105
            transition-transform
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-[#FFD700]
            flex
            items-center
            gap-6
            px-8
          "
        >
          <Users size={32} />

          <span
            className="text-[24px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Teach Me Back
          </span>

        </button>

        {/* Back */}
        <button
          onClick={onBack}
          className="
            w-full
            min-h-[90px]
            border-2
            border-[#FFD700]
            text-[#FFD700]
            rounded-lg
            hover:bg-[#FFD700]
            hover:text-black
            transition-colors
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-[#FFD700]
            flex
            items-center
            justify-center
            gap-4
          "
        >
          <ArrowLeft size={24} />

          <span
            className="text-[22px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Back to Mode Selection
          </span>

        </button>

      </div>

    </div>
  );
}