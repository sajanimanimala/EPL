import {
  Bell,
  TrendingUp,
  ArrowLeft,
  Mic,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

interface ProductivityModeProps {
  onBack: () => void;
}

interface Task {
  id: number;
  text: string;
  duration: number;
  done: boolean | null;
  timeSpent: number;
}

interface Reminder {
  id: number;
  text: string;
  triggerMinutes: number;
  triggered: boolean;
}

interface PerformanceEntry {
  task: string;
  completed: boolean;
  expected: number;
  actual: number;
}

// ── Record audio for given ms ──
async function recordAudio(ms: number): Promise<string> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  return new Promise((resolve) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      try {
        const res = await fetch("http://127.0.0.1:8000/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        resolve(data.text || "");
      } catch {
        resolve("");
      }
    };

    mediaRecorder.start(100);
    setTimeout(() => mediaRecorder.stop(), ms);
  });
}

// ── Speak and wait until finished with buffer ──
function speakAndWait(text: string): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.onend = () => setTimeout(() => resolve(), 800);
    utterance.onerror = () => setTimeout(() => resolve(), 800);
    speechSynthesis.speak(utterance);
  });
}

// ── Format time for display ──
function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

// ── Format time for speaking ──
function formatTimeSpeak(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h} hour${h > 1 ? "s" : ""}`);
  if (m > 0) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
  if (s > 0 && h === 0) parts.push(`${s} second${s > 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(" and ") : "0 seconds";
}

export default function ProductivityMode({ onBack }: ProductivityModeProps) {
  type Screen = "plan" | "reminders" | "tasks" | "done";

  const [screen, setScreen] = useState<Screen>("plan");
  const [status, setStatus] = useState("Getting ready...");
  const [transcript, setTranscript] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [performance, setPerformance] = useState<PerformanceEntry[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reminderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const tasksRef = useRef<Task[]>([]);
  const currentTaskRef = useRef(0);
  const timerSecondsRef = useRef(0);
  const timerRunningRef = useRef(false);
  const performanceRef = useRef<PerformanceEntry[]>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { currentTaskRef.current = currentTaskIndex; }, [currentTaskIndex]);
  useEffect(() => { timerSecondsRef.current = timerSeconds; }, [timerSeconds]);
  useEffect(() => { timerRunningRef.current = timerRunning; }, [timerRunning]);
  useEffect(() => { performanceRef.current = performance; }, [performance]);

  useEffect(() => {
    startFlow();
    startReminderWatcher();
    return () => {
      stopListening();
      if (timerRef.current) clearInterval(timerRef.current);
      if (reminderRef.current) clearInterval(reminderRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  // ══════════════════════════════════════════
  // STEP 1 — Ask for day plan
  // ══════════════════════════════════════════
  async function startFlow() {
    setScreen("plan");
    setStatus("Speaking...");

    await speakAndWait(
      "Welcome to Productivity Mode. Please tell me all your tasks for today. For example: Study maths for 30 minutes, exercise for 20 minutes, read a book for 1 hour. You have 20 seconds to speak."
    );

    setStatus("Listening... Speak all your tasks now");
    const text = await recordAudio(20000);
    setTranscript(text);

    if (!text || text.trim().length < 5) {
      setStatus("Could not hear. Trying again...");
      await speakAndWait("I could not hear you clearly. Let us try again.");
      return startFlow();
    }

    await parseTasks(text);
  }

  // ══════════════════════════════════════════
  // STEP 2 — Parse tasks
  // ══════════════════════════════════════════
  async function parseTasks(text: string) {
    setStatus("Processing tasks...");

    const cleaned = text
      .replace(/these are my tasks for the day/gi, "")
      .replace(/that's all/gi, "")
      .trim();

    const durationMatches = Array.from(
      cleaned.matchAll(
        /[^,;.?!\n]+?\bfor\b\s*\d+\s*(?:hours?|hrs?|minutes?|mins?)\b/gi
      )
    ).map((m) => m[0].trim());

    let parts: string[];

    if (durationMatches.length > 1) {
      parts = durationMatches;
    } else {
      parts = cleaned
        .split(/,|\band\b|\bthen\b|\balso\b|;/gi)
        .map((t) => t.trim())
        .filter((t) => t.length > 3);
    }

    if (parts.length === 0) {
      await speakAndWait("I could not understand your tasks. Please try again.");
      return startFlow();
    }

    const parsed: Task[] = parts.map((t, i) => ({
      id: i + 1,
      text: t.charAt(0).toUpperCase() + t.slice(1),
      duration: extractDuration(t),
      done: null,
      timeSpent: 0,
    }));

    tasksRef.current = parsed;
    setTasks(parsed);

    const summary = parsed
      .map(
        (t) =>
          `Task ${t.id}: ${t.text}${t.duration > 0 ? `, ${formatTimeSpeak(t.duration)}` : ""}`
      )
      .join(". ");

    await speakAndWait(`I have noted ${parsed.length} tasks. ${summary}.`);

    await askReminders(parsed);
  }

  // ══════════════════════════════════════════
  // STEP 3 — Ask for reminders
  // ══════════════════════════════════════════
  async function askReminders(parsed: Task[]) {
    setScreen("reminders");
    setStatus("Speaking...");

    await speakAndWait("Do you want to set any reminders? Say yes or no.");

    setStatus("Listening...");
    const answer = await recordAudio(6000);
    setTranscript(answer);

    const lower = answer.toLowerCase();

    if (
      lower.includes("yes") ||
      lower.includes("yeah") ||
      lower.includes("sure") ||
      lower.includes("okay")
    ) {
      await speakAndWait(
        "Tell me your reminders. For example: remind me in 30 minutes to drink water, remind me in 1 hour to take a break. You have 15 seconds."
      );

      setStatus("Listening...");
      const reminderText = await recordAudio(15000);
      setTranscript(reminderText);
      parseReminders(reminderText);

      await speakAndWait("Reminders noted. Let us begin your tasks.");
    } else {
      await speakAndWait("No reminders set. Let us begin your tasks.");
    }

    await beginTask(parsed, 0);
  }

  // ══════════════════════════════════════════
  // PARSE REMINDERS
  // ══════════════════════════════════════════
  function parseReminders(text: string) {
    const parts = text
      .split(/remind me|reminder/gi)
      .filter((p) => p.trim().length > 3);

    const parsed: Reminder[] = [];

    parts.forEach((part) => {
      const minMatch = part.match(/(\d+)\s*min/i);
      const hourMatch = part.match(/(\d+)\s*hour/i);
      const toMatch = part.match(/to\s+(.+?)(?:,|$)/i);

      let minutes = 0;
      if (minMatch) minutes += parseInt(minMatch[1]);
      if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;

      const reminderText = toMatch ? toMatch[1].trim() : part.trim();

      if (minutes > 0 && reminderText.length > 0) {
        parsed.push({
          id: Date.now() + Math.random(),
          text: reminderText,
          triggerMinutes: minutes,
          triggered: false,
        });
      }
    });

    setReminders(parsed);

    if (parsed.length > 0) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `${parsed.length} reminder${parsed.length > 1 ? "s" : ""} set.`
      );
      u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  }

  // ══════════════════════════════════════════
  // STEP 4 — Begin each task
  // ══════════════════════════════════════════
  async function beginTask(parsed: Task[], index: number) {
    if (index >= parsed.length) {
      return allTasksDone();
    }

    setScreen("tasks");
    setCurrentTaskIndex(index);
    currentTaskRef.current = index;
    setTimerSeconds(0);
    timerSecondsRef.current = 0;
    setTimerRunning(false);
    timerRunningRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);

    const task = parsed[index];

    const durationText =
      task.duration > 0
        ? `This task has a timer of ${formatTimeSpeak(task.duration)}.`
        : "No duration detected. A stopwatch will run.";

    await speakAndWait(
      `Task ${task.id}: ${task.text}. ${durationText} Say yes to start the timer or say no to skip.`
    );

    startListening();
  }

  // ══════════════════════════════════════════
  // CONTINUOUS LISTENING
  // ══════════════════════════════════════════
  function startListening() {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        "Continuous voice not supported. Please use Chrome."
      );
      speechSynthesis.speak(u);
      return;
    }

    stopListening();

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const cmd = last[0].transcript.toLowerCase().trim();
      setTranscript(cmd);
      console.log("Command:", cmd);
      handleCommand(cmd);
    };

    rec.onerror = () => {
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }, 1000);
    };

    rec.onend = () => {
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }, 300);
    };

    recognitionRef.current = rec;
    setStatus("Listening...");
    try { rec.start(); } catch (_) {}
  }

  function stopListening() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    setStatus("Idle");
  }

  // ══════════════════════════════════════════
  // VOICE COMMAND HANDLER
  // ══════════════════════════════════════════
  function handleCommand(cmd: string) {
    const index = currentTaskRef.current;
    const task = tasksRef.current[index];
    if (!task) return;

    // YES — start timer
    if (
      (cmd.includes("yes") ||
        cmd.includes("start") ||
        cmd.includes("okay") ||
        cmd.includes("sure")) &&
      !timerRunningRef.current
    ) {
      startTimer(task.duration);
      speechSynthesis.cancel();
      const msg =
        task.duration > 0
          ? `Timer started. You have ${formatTimeSpeak(task.duration)} for Task ${task.id}. Say done when finished.`
          : `Stopwatch started for Task ${task.id}. Say done when finished.`;
      const u = new SpeechSynthesisUtterance(msg);
      u.rate = 0.85;
      speechSynthesis.speak(u);
      return;
    }

    // DONE — complete task
    if (cmd.includes("done") && !cmd.includes("not done")) {
      finishTask(index, true);
      return;
    }

    // NOT DONE / NO / SKIP
    if (
      cmd.includes("not done") ||
      cmd.includes("skip") ||
      (cmd.includes("no") && !timerRunningRef.current)
    ) {
      finishTask(index, false);
      return;
    }

    // PAUSE
    if (cmd.includes("pause")) {
      pauseTimer();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Timer paused.");
      u.rate = 0.85;
      speechSynthesis.speak(u);
      return;
    }

    // RESUME
    if (cmd.includes("resume") || cmd.includes("continue")) {
      resumeTimer(task.duration);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Timer resumed.");
      u.rate = 0.85;
      speechSynthesis.speak(u);
      return;
    }

    // PERFORMANCE ANALYSIS
    if (
      cmd.includes("performance") ||
      cmd.includes("analysis") ||
      cmd.includes("how did i do") ||
      cmd.includes("progress")
    ) {
      readPerformance();
      return;
    }
  }

  // ══════════════════════════════════════════
  // TIMER
  // ══════════════════════════════════════════
  function startTimer(duration: number) {
    if (timerRef.current) clearInterval(timerRef.current);

    setTimerRunning(true);
    timerRunningRef.current = true;
    setTimerSeconds(0);
    timerSecondsRef.current = 0;

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 1;
        timerSecondsRef.current = next;

        if (duration > 0 && next >= duration) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          timerRunningRef.current = false;
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(
            `Time is up for Task ${currentTaskRef.current + 1}. Say done if completed, or not done to mark as incomplete.`
          );
          u.rate = 0.85;
          speechSynthesis.speak(u);
        }

        return next;
      });
    }, 1000);
  }

  function pauseTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    timerRunningRef.current = false;
  }

  function resumeTimer(duration: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(true);
    timerRunningRef.current = true;

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 1;
        timerSecondsRef.current = next;

        if (duration > 0 && next >= duration) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          timerRunningRef.current = false;
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(
            "Time is up. Say done or not done."
          );
          u.rate = 0.85;
          speechSynthesis.speak(u);
        }

        return next;
      });
    }, 1000);
  }

  // ══════════════════════════════════════════
  // FINISH TASK
  // ══════════════════════════════════════════
  function finishTask(index: number, completed: boolean) {
    if (timerRef.current) clearInterval(timerRef.current);

    const spent = timerSecondsRef.current;
    const task = tasksRef.current[index];
    if (!task) return;

    const updated = [...tasksRef.current];
    updated[index] = { ...task, done: completed, timeSpent: spent };
    tasksRef.current = updated;
    setTasks([...updated]);

    const entry: PerformanceEntry = {
      task: task.text,
      completed,
      expected: task.duration,
      actual: spent,
    };
    performanceRef.current = [...performanceRef.current, entry];
    setPerformance([...performanceRef.current]);

    setTimerRunning(false);
    timerRunningRef.current = false;
    setTimerSeconds(0);
    timerSecondsRef.current = 0;

    speechSynthesis.cancel();
    const resultMsg = completed
      ? `Great job! Task ${task.id} completed in ${formatTimeSpeak(spent)}.`
      : `Task ${task.id} skipped. Time spent: ${formatTimeSpeak(spent)}.`;
    const u = new SpeechSynthesisUtterance(resultMsg);
    u.rate = 0.85;
    speechSynthesis.speak(u);

    const nextIndex = index + 1;

    if (nextIndex < updated.length) {
      setCurrentTaskIndex(nextIndex);
      currentTaskRef.current = nextIndex;

      setTimeout(async () => {
        stopListening();
        const nextTask = updated[nextIndex];
        const durationText =
          nextTask.duration > 0
            ? `Timer set for ${formatTimeSpeak(nextTask.duration)}.`
            : "Stopwatch will run.";
        await speakAndWait(
          `Moving to Task ${nextTask.id}: ${nextTask.text}. ${durationText} Say yes to start or no to skip.`
        );
        startListening();
      }, 2500);
    } else {
      setTimeout(() => allTasksDone(), 2500);
    }
  }

  // ══════════════════════════════════════════
  // ALL TASKS DONE
  // ══════════════════════════════════════════
  function allTasksDone() {
    setScreen("done");
    stopListening();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      "You have completed all tasks for today! Say performance analysis to hear your results."
    );
    u.rate = 0.85;
    speechSynthesis.speak(u);
    setTimeout(() => startListening(), 5000);
  }

  // ══════════════════════════════════════════
  // PERFORMANCE ANALYSIS
  // ══════════════════════════════════════════
  function readPerformance() {
    const perf = performanceRef.current;

    if (perf.length === 0) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        "No performance data yet. Complete at least one task first."
      );
      u.rate = 0.85;
      speechSynthesis.speak(u);
      return;
    }

    const completed = perf.filter((p) => p.completed);
    const pending = perf.filter((p) => !p.completed);
    const totalTime = perf.reduce((sum, p) => sum + p.actual, 0);

    const sentences: string[] = [];

    sentences.push(
      `Performance analysis. You completed ${completed.length} out of ${perf.length} tasks.`
    );
    sentences.push(`Total time spent: ${formatTimeSpeak(totalTime)}.`);

    if (completed.length > 0) {
      sentences.push("Here are your completed tasks.");
      completed.forEach((p, i) => {
        sentences.push(
          `Task ${i + 1}: ${p.task}. Finished in ${formatTimeSpeak(p.actual)}.`
        );
      });
    }

    if (pending.length > 0) {
      sentences.push("Pending or skipped tasks.");
      pending.forEach((p) => {
        sentences.push(
          `${p.task}. Time spent: ${formatTimeSpeak(p.actual)}.`
        );
      });
    }

    if (completed.length === perf.length) {
      sentences.push("Excellent work! You completed everything today.");
    } else if (completed.length >= perf.length / 2) {
      sentences.push("Good effort! Keep pushing tomorrow.");
    } else {
      sentences.push("Do not worry. Tomorrow is a new opportunity.");
    }

    speechSynthesis.cancel();

    // speak sentence by sentence with pause between each
    let i = 0;
    function speakNext() {
      if (i >= sentences.length) return;
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.rate = 0.85;
      u.onend = () => {
        i++;
        setTimeout(speakNext, 500);
      };
      speechSynthesis.speak(u);
    }
    speakNext();
  }

  // ══════════════════════════════════════════
  // REMINDER WATCHER
  // ══════════════════════════════════════════
  function startReminderWatcher() {
    startTimeRef.current = Date.now();
    reminderRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 60000;
      setReminders((prev) =>
        prev.map((r) => {
          if (!r.triggered && elapsed >= r.triggerMinutes) {
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(`Reminder: ${r.text}`);
            u.rate = 0.85;
            speechSynthesis.speak(u);
            return { ...r, triggered: true };
          }
          return r;
        })
      );
    }, 30000);
  }

  // ══════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════
  function extractDuration(text: string): number {
    const hourMatch = text.match(/(\d+)\s*(?:hours?|hrs?)\b/i);
    const minMatch = text.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
    let seconds = 0;
    if (hourMatch) seconds += parseInt(hourMatch[1]) * 3600;
    if (minMatch) seconds += parseInt(minMatch[1]) * 60;
    return seconds;
  }

  const currentTask = tasks[currentTaskIndex];

  // ══════════════════════════════════════════
  // SCREEN: PLAN INPUT
  // ══════════════════════════════════════════
  if (screen === "plan") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: "Neuton, serif" }}>
            Productivity Mode
          </h1>
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-10 w-full flex flex-col items-center gap-6">
            <Mic
              size={64}
              className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"}
            />
            <p className="text-[22px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
              {status.startsWith("Speaking") && "🔊 Listen to instructions..."}
              {status.startsWith("Listening") && "🎙️ Speak all your tasks now..."}
              {status.startsWith("Processing") && "⏳ Processing your tasks..."}
              {status.startsWith("Could") && "❌ Could not hear. Trying again..."}
              {status.startsWith("Getting") && "⏳ Getting ready..."}
            </p>
            <span className="text-[#FFD700] text-[18px]">Status: {status}</span>
          </div>
          {transcript && (
            <p className="text-gray-400 text-[14px] text-center">Heard: "{transcript}"</p>
          )}
          <button
            onClick={onBack}
            className="w-full min-h-[55px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-colors font-bold"
            style={{ fontFamily: "Neuton, serif" }}
          >
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: REMINDER INPUT
  // ══════════════════════════════════════════
  if (screen === "reminders") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: "Neuton, serif" }}>
            Reminders
          </h1>
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-10 w-full flex flex-col items-center gap-6">
            <Bell
              size={64}
              className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"}
            />
            <p className="text-[22px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
              {status.startsWith("Speaking") && "🔊 Do you want reminders?"}
              {status.startsWith("Listening") && "🎙️ Say yes or no..."}
              {status.startsWith("Processing") && "⏳ Setting reminders..."}
            </p>
            <span className="text-[#FFD700] text-[18px]">Status: {status}</span>
          </div>
          {transcript && (
            <p className="text-gray-400 text-[14px] text-center">Heard: "{transcript}"</p>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: ALL DONE
  // ══════════════════════════════════════════
  if (screen === "done") {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          <div className="flex justify-between items-center">
            <h1 className="text-[48px] font-bold" style={{ fontFamily: "Neuton, serif" }}>
              Productivity Mode
            </h1>
            <button
              onClick={() => { stopListening(); onBack(); }}
              className="border-2 border-[#FFD700] text-[#FFD700] px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
              style={{ fontFamily: "Neuton, serif" }}
            >
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="bg-green-900 border-2 border-green-400 rounded-xl p-8 text-center">
            <p className="text-[32px] font-bold text-green-400" style={{ fontFamily: "Neuton, serif" }}>
              🎉 All tasks completed!
            </p>
            <p className="text-gray-300 mt-3 text-[18px]">
              Say "performance analysis" or tap the button below.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Mic
                size={20}
                className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"}
              />
              <span className="text-[#FFD700] text-[16px]">{status}</span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
            <h2 className="text-[24px] font-bold mb-4 text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
              All Tasks
            </h2>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center border border-gray-700 rounded-lg p-4">
                  <div>
                    <p className="font-bold text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
                      Task {task.id}
                    </p>
                    <p
                      className={task.done === true ? "line-through text-gray-500" : task.done === false ? "text-red-400" : "text-white"}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {task.text}
                    </p>
                    <p className="text-gray-400 text-[14px]">
                      Time spent: {formatTimeSpeak(task.timeSpent)}
                    </p>
                  </div>
                  <div>
                    {task.done === true && <CheckCircle className="text-green-500" size={28} />}
                    {task.done === false && <XCircle className="text-red-500" size={28} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={readPerformance}
            className="w-full min-h-[70px] bg-[#FFD700] text-black rounded-xl flex items-center justify-center gap-3 font-bold text-[22px] hover:scale-105 transition-transform"
            style={{ fontFamily: "Neuton, serif" }}
          >
            <TrendingUp size={24} /> Performance Analysis
          </button>

          <button
            onClick={() => { stopListening(); onBack(); }}
            className="w-full min-h-[60px] border-2 border-[#FFD700] text-[#FFD700] rounded-xl flex items-center justify-center gap-3 font-bold text-[20px] hover:bg-[#FFD700] hover:text-black transition-colors"
            style={{ fontFamily: "Neuton, serif" }}
          >
            <ArrowLeft size={22} /> Back to Mode Selection
          </button>

        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // SCREEN: TASKS DASHBOARD
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[48px] font-bold" style={{ fontFamily: "Neuton, serif" }}>
              Productivity Mode
            </h1>
            <p className="text-[#FFD700] text-[18px]" style={{ fontFamily: "Inter, sans-serif" }}>
              Voice Assistant Active
            </p>
          </div>
          <button
            onClick={() => { stopListening(); onBack(); }}
            className="border-2 border-[#FFD700] text-[#FFD700] px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
            style={{ fontFamily: "Neuton, serif" }}
          >
            <ArrowLeft size={20} /> Back
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-[#FFD700] rounded-lg p-4 flex items-center gap-4">
          <Mic
            className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"}
            size={26}
          />
          <div>
            <p className="text-[18px]" style={{ fontFamily: "Inter, sans-serif" }}>
              Status: {status}
            </p>
            {transcript && (
              <p className="text-gray-400 text-[13px]">Heard: "{transcript}"</p>
            )}
          </div>
        </div>

        {currentTask && currentTask.done === null && (
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-8">
            <p className="text-[#FFD700] text-[20px] mb-1" style={{ fontFamily: "Neuton, serif" }}>
              Task {currentTask.id} of {tasks.length}
            </p>
            <p className="text-[28px] font-bold mb-6" style={{ fontFamily: "Neuton, serif" }}>
              {currentTask.text}
            </p>
            <div className="flex flex-col items-center gap-2 mb-6">
              <p className="text-[72px] font-bold text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
                {currentTask.duration > 0
                  ? formatTime(Math.max(0, currentTask.duration - timerSeconds))
                  : formatTime(timerSeconds)}
              </p>
              <p className="text-gray-400 text-[16px]">
                {currentTask.duration > 0 ? "Countdown" : "Stopwatch"} —{" "}
                <span className={timerRunning ? "text-green-400" : "text-red-400"}>
                  {timerRunning ? "🟢 Running" : "🔴 Stopped"}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => finishTask(currentTaskIndex, true)}
                className="min-h-[65px] bg-green-600 text-white rounded-lg flex items-center justify-center gap-3 font-bold text-[20px] hover:scale-105 transition-transform"
                style={{ fontFamily: "Neuton, serif" }}
              >
                <CheckCircle size={24} /> Done
              </button>
              <button
                onClick={() => finishTask(currentTaskIndex, false)}
                className="min-h-[65px] bg-red-700 text-white rounded-lg flex items-center justify-center gap-3 font-bold text-[20px] hover:scale-105 transition-transform"
                style={{ fontFamily: "Neuton, serif" }}
              >
                <XCircle size={24} /> Not Done
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
          <h2 className="text-[24px] font-bold mb-4 text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
            All Tasks
          </h2>
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className={`flex justify-between items-center rounded-lg p-4 border ${
                  i === currentTaskIndex && task.done === null ? "border-[#FFD700]" : "border-gray-700"
                }`}
              >
                <div>
                  <p className="font-bold text-[#FFD700] text-[15px]" style={{ fontFamily: "Neuton, serif" }}>
                    Task {task.id}
                    {task.duration > 0 && (
                      <span className="text-gray-400 font-normal ml-2 text-[13px]">
                        ({formatTime(task.duration)})
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-[16px] ${
                      task.done === true ? "line-through text-gray-500"
                      : task.done === false ? "text-red-400"
                      : "text-white"
                    }`}
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {task.text}
                  </p>
                  {task.timeSpent > 0 && (
                    <p className="text-gray-400 text-[13px]">
                      Time: {formatTimeSpeak(task.timeSpent)}
                    </p>
                  )}
                </div>
                <div>
                  {task.done === true && <CheckCircle className="text-green-500" size={26} />}
                  {task.done === false && <XCircle className="text-red-500" size={26} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
            <h2 className="text-[24px] font-bold mb-4 text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
              <Bell size={20} className="inline mr-2" />Reminders
            </h2>
            <div className="space-y-3">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className={`border rounded-lg p-3 flex items-center gap-3 ${
                    r.triggered ? "border-gray-700 opacity-50" : "border-[#FFD700]"
                  }`}
                >
                  <Bell size={16} className={r.triggered ? "text-gray-500" : "text-[#FFD700]"} />
                  <p className="text-[15px]" style={{ fontFamily: "Inter, sans-serif" }}>
                    In {r.triggerMinutes} min: {r.text}{r.triggered && " ✓"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={readPerformance}
          className="w-full min-h-[70px] bg-[#FFD700] text-black rounded-xl flex items-center justify-center gap-3 font-bold text-[22px] hover:scale-105 transition-transform"
          style={{ fontFamily: "Neuton, serif" }}
        >
          <TrendingUp size={24} /> Performance Analysis
        </button>

        <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5">
          <h3 className="text-[16px] font-bold mb-3 text-[#FFD700]" style={{ fontFamily: "Neuton, serif" }}>
            Voice Commands
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-300" style={{ fontFamily: "Inter, sans-serif" }}>
            <span>🎙️ "yes" → Start timer</span>
            <span>✅ "done" → Complete task</span>
            <span>❌ "not done" / "no" → Skip</span>
            <span>⏸️ "pause" / "resume"</span>
            <span>📊 "performance analysis"</span>
            <span>🔙 "go back" → Exit</span>
          </div>
        </div>

      </div>
    </div>
  );
}