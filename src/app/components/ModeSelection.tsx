import {
  Briefcase,
  BookOpen,
  Search,
  RotateCcw,
  Mic,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import { recordAndSendAudio } from "../../services/speech/speechToText";
import { speak } from "../../services/speech/textToSpeech";

interface ModeSelectionProps {
  onSelectMode: (mode: 'productivity' | 'learning' | 'research') => void;
}

export default function ModeSelection({
  onSelectMode,
}: ModeSelectionProps) {

  const [status, setStatus] = useState("Idle");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    startVoiceFlow();
  }, []);

  async function startVoiceFlow() {

    setStatus("Speaking...");

    speak(
      "Choose a mode. Say Productivity Mode, Learning Mode, or Research Mode."
    );

    setTimeout(async () => {

      setStatus("Listening...");

      const text = await recordAndSendAudio();

      setTranscript(text);

      setStatus("Processing...");

      handleVoiceSelection(text);

    }, 5000);
  }

  function handleVoiceSelection(text: string) {

    console.log(text);

    if (text.includes("learning")) {

      speak("Opening Learning Mode");

      setStatus("Speaking...");

      setTimeout(() => {
        onSelectMode("learning");
      }, 2000);
    }

    else if (text.includes("productivity")) {

      speak("Opening Productivity Mode");

      setStatus("Speaking...");

      setTimeout(() => {
        onSelectMode("productivity");
      }, 2000);
    }

    else if (text.includes("research")) {

      speak("Opening Research Mode");

      setStatus("Speaking...");

      setTimeout(() => {
        onSelectMode("research");
      }, 2000);
    }

    else {

      speak("I did not understand. Please try again.");

      setStatus("Idle");
    }
  }

  function repeatInstructions() {

    speak(
      "Say Productivity Mode, Learning Mode, or Research Mode."
    );
  }

  return (
    <div className="flex flex-col h-full px-6 py-12 bg-black text-white">

      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">

        {/* Title */}
        <h1
          className="text-[48px] font-bold text-center mb-4"
          style={{ fontFamily: 'Neuton, serif' }}
        >
          Choose Mode
        </h1>

        {/* Mode Buttons */}
        <div className="flex flex-col gap-6">

          {/* Productivity */}
          <button
            onClick={() => onSelectMode('productivity')}
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
              justify-start
              gap-6
              px-8
            "
          >
            <div className="flex items-center justify-center w-12 h-12 bg-black rounded-full">
              <Briefcase size={24} className="text-white" />
            </div>

            <div className="flex items-center gap-4">
              <span
                className="text-[32px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                1
              </span>

              <span
                className="text-[24px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                Productivity Mode
              </span>
            </div>
          </button>

          {/* Learning */}
          <button
            onClick={() => onSelectMode('learning')}
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
              justify-start
              gap-6
              px-8
            "
          >
            <div className="flex items-center justify-center w-12 h-12 bg-black rounded-full">
              <BookOpen size={24} className="text-white" />
            </div>

            <div className="flex items-center gap-4">
              <span
                className="text-[32px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                2
              </span>

              <span
                className="text-[24px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                Learning Mode
              </span>
            </div>
          </button>

          {/* Research */}
          <button
            onClick={() => onSelectMode('research')}
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
              justify-start
              gap-6
              px-8
            "
          >
            <div className="flex items-center justify-center w-12 h-12 bg-black rounded-full">
              <Search size={24} className="text-white" />
            </div>

            <div className="flex items-center gap-4">
              <span
                className="text-[32px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                3
              </span>

              <span
                className="text-[24px] font-bold"
                style={{ fontFamily: 'Neuton, serif' }}
              >
                Research Mode
              </span>
            </div>
          </button>

        </div>

        {/* Repeat Instructions */}
        <button
          onClick={repeatInstructions}
          className="
            w-full
            min-h-[90px]
            border-2
            border-[#FFD700]
            text-white
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
          <RotateCcw size={24} />

          <span
            className="text-[22px] font-semibold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Repeat Instructions
          </span>
        </button>

        {/* Status */}
        <div className="flex flex-col items-center justify-center gap-2 mt-4">

          <div className="flex items-center gap-3">

            <Mic size={20} className="text-[#FFD700] animate-pulse" />

            <span
              className="text-[18px] text-[#FFD700]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Status: {status}
            </span>

          </div>

          {/* Transcript */}
          {transcript && (
            <p
              className="text-gray-300 text-[18px] text-center mt-2"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Heard: "{transcript}"
            </p>
          )}

        </div>

      </div>
    </div>
  );
}