import { useState } from 'react';
import { FileText, Search, Bookmark, ArrowLeft, Volume2, Mic, Play } from 'lucide-react';

interface ResearchModeProps {
  onBack: () => void;
}

export default function ResearchMode({ onBack }: ResearchModeProps) {
  const [subMode, setSubMode] = useState<'main' | 'audio-reader' | 'search' | 'bookmarks'>('main');
  const [isListening, setIsListening] = useState(false);

  if (subMode === 'audio-reader') {
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
              Audio Research Reader
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Mic size={32} className={isListening ? "text-[#FFD700] animate-pulse" : "text-white"} />
              <p className="text-[22px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                {isListening ? "Listening... Speak your research topic" : "Speak to search papers"}
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

          <div className="space-y-4">
            <h2 className="text-[28px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Research Papers
            </h2>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-white">
              <h3 className="text-[22px] font-bold mb-2" style={{ fontFamily: 'Neuton, serif' }}>
                Attention Is All You Need
              </h3>
              <p className="text-[18px] text-gray-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Vaswani et al., 2017
              </p>
              <button className="w-full min-h-[70px] bg-white text-black rounded-lg
                               hover:scale-105 transition-transform duration-200
                               focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                               flex items-center justify-center gap-4">
                <Play size={24} />
                <span className="text-[20px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                  Play Audio Summary
                </span>
              </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-white">
              <h3 className="text-[22px] font-bold mb-2" style={{ fontFamily: 'Neuton, serif' }}>
                Deep Residual Learning for Image Recognition
              </h3>
              <p className="text-[18px] text-gray-400 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                He et al., 2015
              </p>
              <button className="w-full min-h-[70px] bg-white text-black rounded-lg
                               hover:scale-105 transition-transform duration-200
                               focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                               flex items-center justify-center gap-4">
                <Play size={24} />
                <span className="text-[20px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                  Play Audio Summary
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subMode === 'search') {
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
              Smart Search
            </h1>
          </div>

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
            <button
              onClick={() => setIsListening(!isListening)}
              className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                       hover:scale-105 transition-transform duration-200
                       focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                       flex items-center justify-center gap-4">
              <Mic size={32} />
              <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                {isListening ? "Listening..." : "Speak Search Keywords"}
              </span>
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-8 border-2 border-white">
            <h2 className="text-[28px] font-bold mb-6" style={{ fontFamily: 'Neuton, serif' }}>
              Search Results for "transformer architecture"
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-black rounded-lg border-2 border-[#FFD700]">
                <p className="text-[20px] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  The <span className="bg-[#FFD700] text-black px-2 font-bold">Transformer architecture</span> relies
                  entirely on self-attention mechanisms, dispensing with recurrence and convolutions entirely.
                </p>
                <button className="mt-4 px-6 py-2 bg-[#FFD700] text-black rounded-lg text-[18px] font-semibold">
                  Bookmark
                </button>
              </div>

              <div className="p-4 bg-black rounded-lg border-2 border-white">
                <p className="text-[20px] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Key components include multi-head attention, positional encoding, and feed-forward networks
                  arranged in encoder-decoder stacks.
                </p>
                <button className="mt-4 px-6 py-2 border-2 border-[#FFD700] text-[#FFD700] rounded-lg text-[18px] font-semibold">
                  Bookmark
                </button>
              </div>
            </div>
          </div>

          <button className="w-full min-h-[90px] bg-white text-black rounded-lg
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center justify-center gap-4">
            <Volume2 size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Read Highlighted Results
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (subMode === 'bookmarks') {
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
              Highlights & Bookmarks
            </h1>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-[#FFD700]">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[18px] text-[#FFD700]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Saved 2 hours ago
                </span>
                <Bookmark size={24} className="text-[#FFD700]" />
              </div>
              <p className="text-[20px] leading-relaxed mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                The Transformer architecture relies entirely on self-attention mechanisms, dispensing
                with recurrence and convolutions entirely.
              </p>
              <button className="w-full min-h-[70px] bg-white text-black rounded-lg
                               hover:scale-105 transition-transform duration-200
                               focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                               flex items-center justify-center gap-4">
                <Play size={24} />
                <span className="text-[20px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                  Play This Bookmark
                </span>
              </button>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border-2 border-white">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[18px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Saved 1 day ago
                </span>
                <Bookmark size={24} className="text-white" />
              </div>
              <p className="text-[20px] leading-relaxed mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                Residual connections help training very deep networks by allowing gradients to flow
                directly through skip connections.
              </p>
              <button className="w-full min-h-[70px] bg-white text-black rounded-lg
                               hover:scale-105 transition-transform duration-200
                               focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                               flex items-center justify-center gap-4">
                <Play size={24} />
                <span className="text-[20px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
                  Play This Bookmark
                </span>
              </button>
            </div>
          </div>

          <button className="w-full min-h-[90px] bg-[#FFD700] text-black rounded-lg
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center justify-center gap-4">
            <Volume2 size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Play All Bookmarks
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
        <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: 'Neuton, serif' }}>
          Research Mode
        </h1>

        <div className="flex flex-col gap-6">
          <button
            onClick={() => setSubMode('audio-reader')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <FileText size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Audio Research Reader
            </span>
          </button>

          <button
            onClick={() => setSubMode('search')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <Search size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Smart Search
            </span>
          </button>

          <button
            onClick={() => setSubMode('bookmarks')}
            className="w-full min-h-[90px] bg-white text-black rounded-lg
                     hover:scale-105 transition-transform duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center gap-6 px-8">
            <Bookmark size={32} />
            <span className="text-[24px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Highlights & Bookmarks
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
