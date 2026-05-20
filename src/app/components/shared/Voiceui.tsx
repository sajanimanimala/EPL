// src/app/components/shared/Voiceui.tsx
// Note: filename matches your existing Voiceui.tsx (capital V, lowercase ui)

import { Mic, Volume2, ArrowLeft, Loader2 } from "lucide-react";
import { Status } from "../../../hooks/useLearningMode";

// ── StatusBar ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Status, string> = {
  idle:       "Ready",
  speaking:   "Speaking...",
  listening:  "Listening — speak now",
  processing: "Thinking...",
  error:      "Error — please try again",
};

interface StatusBarProps {
  status: Status;
}

export function StatusBar({ status }: StatusBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-center justify-center gap-3 py-3 px-6 rounded-lg
        border-2 transition-all duration-300
        ${status === "error"
          ? "border-red-500 bg-red-500/10 text-red-400"
          : "border-[#FFD700] bg-[#FFD700]/10 text-[#FFD700]"
        }
      `}
    >
      {status === "processing" ? (
        <Loader2 size={20} className="animate-spin" />
      ) : status === "listening" ? (
        <Mic size={20} className="animate-pulse" />
      ) : status === "speaking" ? (
        <Volume2 size={20} className="animate-pulse" />
      ) : (
        <div className={`w-2 h-2 rounded-full ${status !== "idle" ? "bg-[#FFD700]" : "bg-[#FFD700]/50"}`} />
      )}
      <span
        className="text-[18px] font-medium"
        style={{ fontFamily: "Neuton, serif" }}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
}

// ── VoiceButton ────────────────────────────────────────────────────────────

interface VoiceButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  ariaLabel?: string;
}

export function VoiceButton({
  label,
  icon,
  onClick,
  disabled = false,
  variant = "primary",
  ariaLabel,
}: VoiceButtonProps) {
  const base = `
    w-full min-h-[90px] rounded-xl
    flex items-center gap-5 px-8
    text-[24px] font-bold
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-[#FFD700]
    disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100
  `;

  const variants = {
    primary:   "bg-[#FFD700] text-black hover:scale-[1.02] hover:brightness-110",
    secondary: "bg-white text-black hover:scale-[1.02] hover:brightness-95",
    outline:   "border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={`${base} ${variants[variant]}`}
      style={{ fontFamily: "Neuton, serif" }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

// ── BackButton ─────────────────────────────────────────────────────────────

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = "Back" }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="
        p-3 rounded-lg border-2 border-[#FFD700] text-[#FFD700]
        hover:bg-[#FFD700] hover:text-black
        transition-colors duration-200
        focus:outline-none focus:ring-4 focus:ring-[#FFD700]
      "
    >
      <ArrowLeft size={24} />
    </button>
  );
}

// ── InfoCard ───────────────────────────────────────────────────────────────

interface InfoCardProps {
  title: string;
  body: string;
  highlight?: boolean;
}

export function InfoCard({ title, body, highlight = false }: InfoCardProps) {
  return (
    <div
      className={`
        bg-[#1a1a1a] rounded-xl p-6 border-2 transition-colors
        ${highlight ? "border-[#FFD700]" : "border-white/20"}
      `}
    >
      <h2
        className="text-[22px] font-bold mb-3 text-[#FFD700]"
        style={{ fontFamily: "Neuton, serif" }}
      >
        {title}
      </h2>
      <p
        className="text-[20px] leading-relaxed text-white/90"
        style={{ fontFamily: "Neuton, serif" }}
      >
        {body || <span className="text-white/40 italic">—</span>}
      </p>
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
}

export function PageHeader({ title, onBack }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {onBack && <BackButton onClick={onBack} label={`Back from ${title}`} />}
      <h1
        className="text-[42px] font-bold text-white leading-tight"
        style={{ fontFamily: "Neuton, serif" }}
      >
        {title}
      </h1>
    </div>
  );
}