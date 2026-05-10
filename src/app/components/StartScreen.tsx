import { Volume2 } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="flex flex-col items-center gap-12 max-w-2xl w-full">
        <div className="text-center">
          <h1 className="text-[64px] font-bold mb-4" style={{ fontFamily: 'Neuton, serif' }}>
            EchoEd
          </h1>
          <p className="text-[22px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Voice-First Learning Assistant
          </p>
        </div>

        <button
          onClick={onStart}
          className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                   hover:scale-105 transition-transform duration-200
                   focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                   flex items-center justify-center gap-4"
        >
          <Volume2 size={32} />
          <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
            Start Assistant
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-600"></div>
          <span className="text-[18px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
            Status: Idle
          </span>
        </div>
      </div>
    </div>
  );
}
