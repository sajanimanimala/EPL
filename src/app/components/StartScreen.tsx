import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speak } from '../../services/speech/textToSpeech';

interface StartScreenProps {
  onStart: () => void;
  onDemo: () => void;
}

export default function StartScreen({ onStart, onDemo }: StartScreenProps) {
  const recognitionRef = useRef<any>(null);
  const activeRecognition = useRef(false);
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    speechSynthesis.cancel();

    async function init() {
      setStatus('Speaking...');
      await speakWelcome();
      setStatus('Listening...');
      startStopListener();
    }

    init();

    return () => {
      stopRecognition();
      speechSynthesis.cancel();
    };
  }, []);

  async function speakWelcome() {
    speechSynthesis.cancel();
    await speak(
      'Hey , this is EchoEd - your learning assistant. To get started, say Start Assistant or if you need guidance, say How to use. If you want to stop the voice , Just say Stop.',
    );
  }

  function cancelSpeech() {
    speechSynthesis.cancel();
    setStatus('Idle');
  }

  function handleStart() {
    cancelSpeech();
    stopRecognition();
    setStatus('Speaking...');
    speak('Opening assistant. Please wait.');
    setTimeout(() => {
      onStart();
    }, 1200);
  }

  function handleDemo() {
    cancelSpeech();
    stopRecognition();
    setStatus('Speaking...');
    speak('Opening How to Use guide. Please wait.');
    setTimeout(() => {
      onDemo();
    }, 1200);
  }

  function handleVoiceNavigation(command: 'start' | 'demo' | 'stop') {
    if (command === 'stop') {
      cancelSpeech();
      return;
    }

    stopRecognition();
    cancelSpeech();

    if (command === 'start') {
      setStatus('Speaking...');
      speak('Opening assistant. Please wait.');
      setTimeout(() => {
        onStart();
      }, 1200);
    } else if (command === 'demo') {
      setStatus('Speaking...');
      speak('Opening How to Use guide. Please wait.');
      setTimeout(() => {
        onDemo();
      }, 1200);
    }
  }

  function startStopListener() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      return;
    }

    try {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ')
          .toLowerCase();

        if (transcript.includes('stop')) {
          handleVoiceNavigation('stop');
          return;
        }

        if (transcript.includes('how to use') || transcript.includes('how to')) {
          handleVoiceNavigation('demo');
          return;
        }

        if (transcript.includes('start assistant') || transcript.includes('start') || transcript.includes('assistant')) {
          handleVoiceNavigation('start');
          return;
        }
      };

      recognition.onend = () => {
        if (activeRecognition.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch {
              // ignore restart failure
            }
          }, 500);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      activeRecognition.current = true;
    } catch {
      activeRecognition.current = false;
    }
  }

  function stopRecognition() {
    if (recognitionRef.current) {
      activeRecognition.current = false;
      recognitionRef.current.onend = null;
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }

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

        <button
          onClick={handleDemo}
          className="
            w-full
            min-h-[90px]
            bg-white/10
            text-white
            border border-white/20
            rounded-lg
            hover:bg-white/15
            transition-colors
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-white/20
            flex
            items-center
            justify-center
            gap-4
          "
        >
          <span
            className="text-[24px] font-bold"
            style={{ fontFamily: 'Neuton, serif' }}
          >
            How to use
          </span>
        </button>

        <button
          onClick={cancelSpeech}
          className="
            w-full
            min-h-[70px]
            bg-red-600
            text-white
            rounded-lg
            hover:bg-red-500
            transition-colors
            duration-200
            focus:outline-none
            focus:ring-4
            focus:ring-red-500/40
            flex
            items-center
            justify-center
          "
        >
          Stop Voice
        </button>

        {/* Status Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-600"></div>
            <span
              className="text-[18px] text-gray-400"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Status: {status}
            </span>
          </div>
          <p className="text-[16px] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
            Say "Stop" to stop the voice assistant.
          </p>
        </div>

      </div>
    </div>
  );
}