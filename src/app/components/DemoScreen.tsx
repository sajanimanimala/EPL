import { useEffect, useRef } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { speak } from '../../services/speech/textToSpeech';

interface DemoScreenProps {
  onBack: () => void;
  onStartAssistant: () => void;
}

const demoText = [
  "Welcome to the How to Use guide for EchoEd.",
  "EchoEd is a voice-first study assistant built for study sessions and learning by speaking.",
  "Use the Start Assistant button on the main page to begin your voice-driven experience.",
  "Once the assistant is active, you can speak commands instead of tapping the screen.",
  "Learning Mode helps you understand any topic. Say a topic and EchoEd will explain it clearly, then you can ask to hear it again or choose a new topic.",
  "Research Mode helps you find recent research papers. It searches by paper title, reads the top papers, and lets you open and listen to summaries of the abstract, introduction, and conclusion.",
  "Productivity Mode helps you organize your study work. It listens for tasks, creates a task list, and can help you plan and track your progress.",
  "Every mode is fully voice navigable: speak the mode name, answer prompts, and control the flow with simple commands.",
  "You can always say stop to immediately stop the assistant from speaking.",
  "If you need help, use the How to Use page again for a clear spoken walkthrough.",
  "When you are ready, say Start Assistant to begin or say Go Back to return to the main page.",
  "Use the on-screen buttons as a backup if you prefer visual navigation.","To start your learning journey, just say Start Assistant and let EchoEd guide you with your voice! to go back to the main page, say Go Back",
];

export default function DemoScreen({ onBack, onStartAssistant }: DemoScreenProps) {
  const cancelRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const activeRecognition = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    speakDemo();
    startVoiceListener();

    return () => {
      stopRecognition();
      cancelSpeech();
    };
  }, []);

  async function speakDemo() {
    speechSynthesis.cancel();
    await new Promise((resolve) => setTimeout(resolve, 250));
    for (const sentence of demoText) {
      if (cancelRef.current) {
        return;
      }
      await speak(sentence);
    }
  }

  function cancelSpeech() {
    cancelRef.current = true;
    speechSynthesis.cancel();
  }

  function handleVoiceNavigation(command: 'start' | 'back' | 'stop') {
    if (command === 'stop') {
      cancelSpeech();
      return;
    }

    stopRecognition();
    cancelSpeech();

    if (command === 'start') {
      speak('Opening assistant. Please wait.');
      setTimeout(() => {
        onStartAssistant();
      }, 1200);
    } else if (command === 'back') {
      speak('Returning to the main page.');
      setTimeout(() => {
        onBack();
      }, 1200);
    }
  }

  function startVoiceListener() {
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

        if (transcript.includes('go back') || transcript.includes('go back to') || transcript.includes('back') || transcript.includes('return')) {
          handleVoiceNavigation('back');
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
    <div className="flex flex-col items-center justify-center h-full px-4 py-10 bg-black text-white sm:px-6 sm:py-12">
      <div className="flex flex-col items-center gap-10 max-w-3xl w-full">
        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => {
              cancelSpeech();
              onBack();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white/10 border border-gray-700 text-white hover:bg-white/15"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <button
            onClick={cancelSpeech}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-500"
          >
            Stop Voice
          </button>
        </div>

        <div className="text-center w-full">
          <h1 className="text-[52px] font-bold mb-4" style={{ fontFamily: 'Neuton, serif' }}>
            How to Use EchoEd
          </h1>
          <p className="text-[20px] text-gray-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            Clear spoken and written guidance for using EchoEd, including its modes and voice features.
          </p>
        </div>

        <div className="space-y-4 w-full rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8">
          <p className="text-[18px] text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            How to use EchoEd
          </p>
          <ul className="space-y-3 text-gray-200 text-[16px] leading-7" style={{ fontFamily: 'Inter, sans-serif' }}>
            <li>• Press Start Assistant on the main page to begin the voice experience.</li>
            <li>• Say <strong>Learning Mode</strong> to ask EchoEd to explain any topic in clear language.</li>
            <li>• In Learning Mode, you can say the topic name and then say <strong>again</strong> or <strong>repeat</strong> if you want the explanation repeated.</li>
            <li>• Say <strong>Research Mode</strong> to search for research papers by title and listen to paper summaries.</li>
            <li>• In Research Mode, EchoEd reads paper results aloud and lets you open the best matches for more details.</li>
            <li>• Say <strong>Productivity Mode</strong> to create and manage study tasks, track progress, and set reminders using voice only.</li>
            <li>• Say <strong>Stop</strong> at any time to stop the voice assistant immediately.</li>
            <li>• Say <strong>How to use</strong> again if you need a refresher on how the app works.</li>
            <li>• Use the buttons on screen as a backup if you want both voice and touch navigation.</li>
          </ul>
        </div>

        <button
          onClick={() => {
            cancelSpeech();
            onStartAssistant();
          }}
          className="w-full min-h-[80px] sm:min-h-[90px] bg-[#FFD700] text-black rounded-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-[#FFD700] flex items-center justify-center gap-4"
        >
          <Volume2 size={32} />
          <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
            Start Assistant
          </span>
        </button>
      </div>
    </div>
  );
}
