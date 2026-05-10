import { useState } from 'react';
import { MessageSquare, Brain, Users, ArrowLeft, Volume2, Mic } from 'lucide-react';

interface LearningModeProps {
  onBack: () => void;
}

export default function LearningMode({ onBack }: LearningModeProps) {
  const [subMode, setSubMode] = useState<'main' | 'explanation' | 'recall' | 'teach'>('main');
  const [isListening, setIsListening] = useState(false);

  if (subMode === 'explanation') {
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSubMode('main')}
              className="p-3 rounded-lg border-2 border-[#FFD700] text-[#FFD700]
                       hover:bg-[#FFD700] hover:text-black transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-[48px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Explanation Mode
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Mic size={32} className={isListening ? "text-[#FFD700] animate-pulse" : "text-white"} />
              <p className="text-[22px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {isListening ? "Listening... Speak your topic" : "Press button to speak topic"}
              </p>
            </div>

            <button
              onClick={() => setIsListening(!isListening)}
              className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                       hover:scale-105 transition-transform duration-200
                       focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                       flex items-center justify-center gap-4">
              <Mic size={32} />
              <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                {isListening ? "Stop Recording" : "Speak Topic"}
              </span>
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-8 border-2 border-white">
            <h2 className="text-[28px] font-bold mb-4" style={{ fontFamily: 'Neuton, serif' }}>
              Neural Networks: Backpropagation
            </h2>
            <p className="text-[20px] leading-relaxed mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Backpropagation is the foundation of how neural networks learn. It works by calculating
              the gradient of the loss function with respect to each weight in the network, moving
              backwards from the output layer to the input layer.
            </p>
            <p className="text-[20px] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              The algorithm uses the chain rule from calculus to efficiently compute these gradients,
              allowing the network to adjust its weights and improve predictions over time.
            </p>
          </div>

          <button className="w-full min-h-[90px] bg-white text-black rounded-lg
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center justify-center gap-4">
            <Volume2 size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Play Audio
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (subMode === 'recall') {
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSubMode('main')}
              className="p-3 rounded-lg border-2 border-[#FFD700] text-[#FFD700]
                       hover:bg-[#FFD700] hover:text-black transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-[48px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Active Recall
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[18px] text-[#FFD700]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Question 1 of 5
              </span>
            </div>
            <h2 className="text-[28px] font-bold mb-6" style={{ fontFamily: 'Neuton, serif' }}>
              What is the primary purpose of backpropagation in neural networks?
            </h2>

            <button
              onClick={() => setIsListening(!isListening)}
              className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                       hover:scale-105 transition-transform duration-200
                       focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                       flex items-center justify-center gap-4 mb-4">
              <Mic size={32} />
              <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                {isListening ? "Recording..." : "Answer via Voice"}
              </span>
            </button>

            {isListening && (
              <div className="flex items-center justify-center gap-3">
                <Mic size={20} className="text-[#FFD700] animate-pulse" />
                <span className="text-[18px] text-[#FFD700]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Listening...
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button className="flex-1 min-h-[90px] bg-white text-black rounded-lg
                             hover:scale-105 transition-transform duration-200
                             focus:outline-none focus:ring-4 focus:ring-[#FFD700]">
              <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                Skip
              </span>
            </button>
            <button className="flex-1 min-h-[90px] bg-[#FFD700] text-black rounded-lg
                             hover:scale-105 transition-transform duration-200
                             focus:outline-none focus:ring-4 focus:ring-[#FFD700]">
              <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                Next Question
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (subMode === 'teach') {
    return (
      <div className="flex flex-col h-full px-6 py-8">
        <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSubMode('main')}
              className="p-3 rounded-lg border-2 border-[#FFD700] text-[#FFD700]
                       hover:bg-[#FFD700] hover:text-black transition-colors">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-[48px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Teach Me Back
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
            <p className="text-[22px] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Explain what you've learned about backpropagation in your own words.
            </p>

            <button
              onClick={() => setIsListening(!isListening)}
              className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                       hover:scale-105 transition-transform duration-200
                       focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                       flex items-center justify-center gap-4">
              <Mic size={32} />
              <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                {isListening ? "Recording..." : "Start Teaching"}
              </span>
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-8 border-2 border-white">
            <h2 className="text-[28px] font-bold mb-6 text-[#FFD700]" style={{ fontFamily: 'Neuton, serif' }}>
              Feedback
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-[22px] font-bold mb-2" style={{ fontFamily: 'Neuton, serif' }}>
                  Clarity: ⭐⭐⭐⭐
                </h3>
                <p className="text-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Your explanation was clear and well-structured
                </p>
              </div>

              <div>
                <h3 className="text-[22px] font-bold mb-2" style={{ fontFamily: 'Neuton, serif' }}>
                  Missing Points:
                </h3>
                <ul className="list-disc list-inside text-[20px] space-y-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>How gradients are calculated using the chain rule</li>
                  <li>The role of activation functions in backpropagation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[22px] font-bold mb-2" style={{ fontFamily: 'Neuton, serif' }}>
                  Suggestions:
                </h3>
                <p className="text-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Try explaining with a simple example next time
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
        <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: 'Neuton, serif' }}>
          Learning Mode
        </h1>

        <div className="flex flex-col gap-6">
          <button
            onClick={() => setSubMode('explanation')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <MessageSquare size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Explanation Mode
            </span>
          </button>

          <button
            onClick={() => setSubMode('recall')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <Brain size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Active Recall
            </span>
          </button>

          <button
            onClick={() => setSubMode('teach')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <Users size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Teach Me Back
            </span>
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full min-h-[90px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg
                   hover:bg-[#FFD700] hover:text-black transition-colors duration-200
                   focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                   flex items-center justify-center gap-4">
          <ArrowLeft size={24} />
          <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
            Back to Mode Selection
          </span>
        </button>
      </div>
    </div>
  );
}
