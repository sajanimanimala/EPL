import { Calendar, Clock, Bell, RefreshCw, TrendingUp, ArrowLeft, RotateCcw, Volume2 } from 'lucide-react';

interface ProductivityModeProps {
  onBack: () => void;
}

export default function ProductivityMode({ onBack }: ProductivityModeProps) {
  return (
    <div className="flex flex-col h-full px-6 py-8">
      <div className="max-w-6xl w-full mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[48px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Productivity Mode
            </h1>
            <p className="text-[20px] text-[#FFD700] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Auto Pilot Active
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-8">
          <h2 className="text-[32px] font-bold mb-4 text-[#FFD700]" style={{ fontFamily: 'Neuton, serif' }}>
            Today's Plan
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold">
                1
              </div>
              <div>
                <p className="text-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Review Machine Learning concepts - 9:00 AM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold">
                2
              </div>
              <div>
                <p className="text-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Focus session: Research paper reading - 11:00 AM
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <p className="text-[20px] text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Active recall session - 2:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button className="min-h-[90px] bg-white text-black rounded-lg p-6
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center gap-4">
            <Volume2 size={32} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Read Plan
            </span>
          </button>

          <button className="min-h-[90px] bg-white text-black rounded-lg p-6
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center gap-4">
            <Clock size={32} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Focus Timer
            </span>
          </button>

          <button className="min-h-[90px] bg-white text-black rounded-lg p-6
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center gap-4">
            <Bell size={32} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Reminders
            </span>
          </button>

          <button className="min-h-[90px] bg-white text-black rounded-lg p-6
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center gap-4">
            <RefreshCw size={32} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Revision Scheduler
            </span>
          </button>

          <button className="min-h-[90px] bg-white text-black rounded-lg p-6
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center gap-4 md:col-span-2">
            <TrendingUp size={32} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Performance Tracking
            </span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <button className="flex-1 min-h-[90px] bg-[#FFD700] text-black rounded-lg
                           hover:scale-105 transition-transform duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center justify-center gap-4">
            <Calendar size={24} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Update Plan
            </span>
          </button>

          <button className="flex-1 min-h-[90px] border-2 border-white text-white rounded-lg
                           hover:bg-white hover:text-black transition-colors duration-200
                           focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                           flex items-center justify-center gap-4">
            <RotateCcw size={24} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Repeat
            </span>
          </button>

          <button
            onClick={onBack}
            className="flex-1 min-h-[90px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg
                     hover:bg-[#FFD700] hover:text-black transition-colors duration-200
                     focus:outline-none focus:ring-4 focus:ring-[#FFD700]
                     flex items-center justify-center gap-4">
            <ArrowLeft size={24} />
            <span className="text-[22px] font-bold" style={{ fontFamily: 'Neuton, serif' }}>
              Back
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
