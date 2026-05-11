import { Volume2 } from 'lucide-react';
import { speak } from '../../services/speech/textToSpeech';

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {

  const handleStart = () => {
    speak(
      "Welcome to EchoEd. Say Learning Mode, Productivity Mode, or Research Mode."
    );

    // Delay navigation so speech can complete
    setTimeout(() => {
      onStart();
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 bg-black text-white">
      
      <div className="flex flex-col items-center gap-12 max-w-2xl w-full">
        
        {/* App Title */}
        <div className="text-center">
          <h1
            className="text-[64px] font-bold mb-4"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            EchoEd
          </h1>

          <p
            className="text-[22px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Voice-First Learning Assistant
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
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
          <Volume2 size={32} />

          <span
            className="text-[24px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            Start Assistant
          </span>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>

          <span
            className="text-[18px] text-gray-400"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Status: Idle
          </span>

        </div>

      </div>
    </div>
  );
}