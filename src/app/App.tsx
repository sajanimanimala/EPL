import { useState } from 'react';
import StartScreen from './components/StartScreen';
import DemoScreen from './components/DemoScreen';
import ModeSelection from './components/ModeSelection';
import ProductivityMode from './components/ProductivityMode';
import LearningMode from './components/LearningMode';
import ResearchMode from './components/ResearchMode';

type Screen = 'start' | 'demo' | 'mode-selection' | 'productivity' | 'learning' | 'research';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-y-auto">
      {currentScreen === 'start' && (
        <StartScreen
          onStart={() => setCurrentScreen('mode-selection')}
          onDemo={() => setCurrentScreen('demo')}
        />
      )}
      {currentScreen === 'demo' && (
        <DemoScreen
          onBack={() => setCurrentScreen('start')}
          onStartAssistant={() => setCurrentScreen('mode-selection')}
        />
      )}

      {currentScreen === 'mode-selection' && (
        <ModeSelection
          onSelectMode={(mode) => {
            if (mode === 'productivity') setCurrentScreen('productivity');
            if (mode === 'learning') setCurrentScreen('learning');
            if (mode === 'research') setCurrentScreen('research');
          }}
          onGoBack={() => setCurrentScreen('start')}
        />
      )}

      {currentScreen === 'productivity' && (
        <ProductivityMode onBack={() => setCurrentScreen('mode-selection')} />
      )}

      {currentScreen === 'learning' && (
        <LearningMode onBack={() => setCurrentScreen('mode-selection')} />
      )}

      {currentScreen === 'research' && (
        <ResearchMode onBack={() => setCurrentScreen('mode-selection')} />
      )}
    </div>
  );
}