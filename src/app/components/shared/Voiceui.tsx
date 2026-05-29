// src/app/components/shared/Voiceui.tsx
//
// Visual feedback only — for partially sighted users.
// No navigation buttons. All navigation is voice-driven.
//
// Import depth: shared → components → app → src → hooks = 4 levels up

import { Mic, Volume2, Loader2 } from "lucide-react";
import { Status } from "../../../../hooks/useLearningMode";

// ── StatusBar ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Status, { label: string; colorClass: string }> = {
  idle:       { label: "Waiting",               colorClass: "border-white/20  bg-white/5       text-white/50"   },
  speaking:   { label: "Speaking...",           colorClass: "border-[#FFD700] bg-[#FFD700]/10  text-[#FFD700]"  },
  listening:  { label: "Listening — speak now", colorClass: "border-green-400 bg-green-400/10  text-green-400"  },
  processing: { label: "Thinking...",           colorClass: "border-blue-400  bg-blue-400/10   text-blue-400"   },
  error:      { label: "Error — stand by",      colorClass: "border-red-500   bg-red-500/10    text-red-400"    },
};

interface StatusBarProps {
  status: Status;
}

export function StatusBar({ status }: StatusBarProps) {
  const { label, colorClass } = STATUS_CONFIG[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-center justify-center gap-3
        py-4 px-6 rounded-xl border-2
        transition-all duration-300
        ${colorClass}
      `}
    >
      {status === "processing" && <Loader2 size={22} className="animate-spin"  />}
      {status === "listening"  && <Mic     size={22} className="animate-pulse" />}
      {status === "speaking"   && <Volume2 size={22} className="animate-pulse" />}
      {(status === "idle" || status === "error") && (
        <div className="w-2.5 h-2.5 rounded-full bg-current" />
      )}

      <span
        className="text-[20px] font-semibold"
        style={{ fontFamily: "Neuton, serif" }}
      >
        {label}
      </span>
    </div>
  );
}