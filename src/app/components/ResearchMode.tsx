import { useEffect, useRef, useState } from "react";
import { Search, ArrowLeft, Mic, Volume2, Play, Highlighter } from "lucide-react";

interface ResearchModeProps {
  onBack: () => void;
}

interface Paper {
  id: number;
  title: string;
  authors: string;
  year: string;
  journal: string;
  abstract: string;
  introduction: string;
  conclusion: string;
}

interface HighlightEntry {
  paperTitle: string;
  section: string;
  text: string;
}

// ─── Speech helpers ──────────────────────────────────────────────────────────

function speakAndWait(text: string): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1;
    u.volume = 1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function recordAudio(ms: number): Promise<string> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    return new Promise((resolve) => {
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "recording.webm");
        try {
          const res = await fetch("http://127.0.0.1:8000/transcribe", { method: "POST", body: form });
          const data = await res.json();
          resolve(data.text || "");
        } catch {
          resolve("");
        }
      };
      recorder.start();
      setTimeout(() => recorder.stop(), ms);
    });
  } catch {
    return "";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResearchMode({ onBack }: ResearchModeProps) {
  type Screen = "intro" | "listening" | "searching" | "papers" | "reading" | "highlights";

  const [screen, setScreen] = useState<Screen>("intro");
  const [topic, setTopic] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const [highlightedSentence, setHighlightedSentence] = useState<{ section: string; idx: number } | null>(null);
  const [isReading, setIsReading] = useState(false);

  // Refs so voice command closures always read latest values
  const papersRef = useRef<Paper[]>([]);
  const selectedPaperRef = useRef<Paper | null>(null);
  const currentSentenceRef = useRef<{ section: string; text: string } | null>(null);
  const highlightsRef = useRef<HighlightEntry[]>([]);
  const recognitionRef = useRef<any>(null);
  const stopReadingRef = useRef(false);
  const screenRef = useRef<Screen>("intro");

  useEffect(() => { papersRef.current = papers; }, [papers]);
  useEffect(() => { selectedPaperRef.current = selectedPaper; }, [selectedPaper]);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(() => {
    askTopic();
    return () => {
      stopListening();
      speechSynthesis.cancel();
    };
  }, []);

  // ─── Flow ─────────────────────────────────────────────────────────────────

  async function askTopic() {
    setScreen("intro");
    await speakAndWait("Welcome to Research Mode. Which topic would you like to research?");
    setScreen("listening");
    const transcript = await recordAudio(10000);

    if (!transcript || transcript.trim().length < 2) {
      await speakAndWait("I could not hear you. Please try again.");
      askTopic();
      return;
    }

    setTopic(transcript.trim());
    await searchPapers(transcript.trim());
  }

  async function searchPapers(query: string) {
    setScreen("searching");
    await speakAndWait(`Searching research papers on ${query}`);

    try {
      const res = await fetch(`http://127.0.0.1:8000/research/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        await speakAndWait("No papers found. Please try another topic.");
        askTopic();
        return;
      }

      papersRef.current = data.results;
      setPapers(data.results);
      setScreen("papers");
      await speakAndWait(
        `I found ${data.results.length} papers on ${query}. ` +
        `Say "read paper one" or "read paper two" to listen to a paper.`
      );
      startListening();
    } catch {
      await speakAndWait("Something went wrong. Please try again.");
      askTopic();
    }
  }

  // ─── Reading ──────────────────────────────────────────────────────────────

  async function readPaper(paper: Paper) {
    stopListening();
    stopReadingRef.current = false;
    setSelectedPaper(paper);
    selectedPaperRef.current = paper;
    setHighlightedSentence(null);
    setScreen("reading");
    setIsReading(true);

    await speakAndWait(`Reading paper: ${paper.title}`);

    const sections: { key: string; label: string; text: string }[] = [
      { key: "abstract", label: "Abstract", text: paper.abstract },
      { key: "introduction", label: "Introduction", text: paper.introduction },
      { key: "conclusion", label: "Conclusion", text: paper.conclusion },
    ];

    for (const section of sections) {
      if (stopReadingRef.current) break;
      await speakAndWait(section.label);

      const sentences = splitSentences(section.text);
      for (let i = 0; i < sentences.length; i++) {
        if (stopReadingRef.current) break;

        currentSentenceRef.current = { section: section.key, text: sentences[i] };
        setHighlightedSentence({ section: section.key, idx: i });

        await speakAndWait(sentences[i]);
      }
    }

    setIsReading(false);
    currentSentenceRef.current = null;

    if (!stopReadingRef.current) {
      await speakAndWait(
        "Done reading. Say highlight this line to highlight the last sentence, " +
        "read highlights to hear your highlights, or go back to return."
      );
    }

    startListening();
  }

  // ─── Highlights screen ────────────────────────────────────────────────────

  async function readHighlights() {
    stopListening();
    setScreen("highlights");

    const hl = highlightsRef.current;
    if (hl.length === 0) {
      await speakAndWait("You have no highlights yet.");
    } else {
      await speakAndWait(`You have ${hl.length} highlighted lines.`);
      for (const h of hl) {
        await speakAndWait(`From ${h.paperTitle}, ${h.section}: ${h.text}`);
      }
      await speakAndWait("End of highlights.");
    }

    startListening();
  }

  // ─── Voice commands ───────────────────────────────────────────────────────

  function startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    stopListening();

    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";

    r.onresult = (e: any) => {
      const cmd = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      console.log("CMD:", cmd);
      handleCommand(cmd);
    };

    r.onend = () => {
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      }, 300);
    };

    r.onerror = (e: any) => console.error("SR error:", e);

    recognitionRef.current = r;
    try { r.start(); } catch {}
  }

  function stopListening() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }

  async function handleCommand(cmd: string) {
    // ── read paper one / two ──
    const paperMatch = cmd.match(/\b(?:read\s+)?paper\s+(?:number\s+)?(one|two|1|2)\b/);
    const wordOnly = cmd.match(/^(one|two|1|2)$/);
    const match = paperMatch || wordOnly;

    if (match) {
      const token = (paperMatch ? paperMatch[1] : wordOnly![1]);
      const idx = (token === "one" || token === "1") ? 0 : 1;
      const paper = papersRef.current[idx];
      if (paper) {
        stopReadingRef.current = true;
        await readPaper(paper);
      } else {
        await speakAndWait("That paper is not available.");
      }
      return;
    }

    // ── highlight this line ──
    if (/highlight/.test(cmd)) {
      const current = currentSentenceRef.current;
      const paper = selectedPaperRef.current;
      if (current && paper) {
        const entry: HighlightEntry = {
          paperTitle: paper.title,
          section: current.section,
          text: current.text,
        };
        // avoid exact duplicates
        const already = highlightsRef.current.some((h) => h.text === entry.text);
        if (!already) {
          const updated = [...highlightsRef.current, entry];
          highlightsRef.current = updated;
          setHighlights(updated);
        }
        await speakAndWait("Line highlighted.");
      } else {
        await speakAndWait("No line is currently being read.");
      }
      return;
    }

    // ── read highlights ──
    if (/read highlights?/.test(cmd) || /highlights/.test(cmd)) {
      stopReadingRef.current = true;
      await readHighlights();
      return;
    }

    // ── go back ──
    if (/go back|back|exit/.test(cmd)) {
      stopReadingRef.current = true;
      stopListening();
      speechSynthesis.cancel();
      const cur = screenRef.current;
      if (cur === "reading") { setScreen("papers"); startListening(); }
      else if (cur === "highlights") { setScreen("reading"); startListening(); }
      else if (cur === "papers") { onBack(); }
      return;
    }
  }

  // ─── Screens ──────────────────────────────────────────────────────────────

  if (screen === "intro") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Volume2 size={80} className="mx-auto mb-6 text-yellow-400 animate-pulse" />
          <h1 className="text-5xl font-bold">Research Mode</h1>
          <p className="mt-4 text-xl text-gray-400">Starting assistant...</p>
        </div>
      </div>
    );
  }

  if (screen === "listening") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Mic size={80} className="mx-auto mb-6 text-yellow-400 animate-pulse" />
          <h1 className="text-5xl font-bold">Listening...</h1>
          <p className="mt-4 text-xl text-gray-400">Speak your topic now</p>
        </div>
      </div>
    );
  }

  if (screen === "searching") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Search size={80} className="mx-auto mb-6 text-yellow-400 animate-pulse" />
          <h1 className="text-5xl font-bold">Searching Papers...</h1>
          <p className="mt-4 text-yellow-400 text-xl">{topic}</p>
        </div>
      </div>
    );
  }

  if (screen === "papers") {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-5xl font-bold">Research Papers</h1>
              <p className="text-yellow-400 mt-2">{topic}</p>
            </div>
            <button onClick={onBack} className="border border-yellow-400 px-5 py-3 rounded-lg flex items-center gap-2">
              <ArrowLeft size={18} /> Back
            </button>
          </div>

          <div className="space-y-6">
            {papers.map((paper, index) => (
              <div key={paper.id} className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-3">{index + 1}. {paper.title}</h2>
                <p className="text-gray-400">{paper.authors}</p>
                <p className="text-yellow-400 mt-1 mb-4">{paper.journal} • {paper.year}</p>
                <p className="text-gray-300 leading-relaxed">{paper.abstract}</p>
                <button
                  onClick={() => readPaper(paper)}
                  className="mt-6 bg-yellow-400 text-black px-6 py-3 rounded-lg flex items-center gap-2 font-bold hover:scale-105 transition"
                >
                  <Play size={18} /> Read Paper
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-gray-400 text-sm">
            <p>🎤 Say <span className="text-yellow-400">"read paper one"</span> or <span className="text-yellow-400">"read paper two"</span> to start listening</p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "reading" && selectedPaper) {
    const sections = [
      { key: "abstract", label: "Abstract", text: selectedPaper.abstract },
      { key: "introduction", label: "Introduction", text: selectedPaper.introduction },
      { key: "conclusion", label: "Conclusion", text: selectedPaper.conclusion },
    ];

    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => { stopReadingRef.current = true; stopListening(); speechSynthesis.cancel(); setScreen("papers"); startListening(); }}
              className="border border-yellow-400 px-5 py-3 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>

            <button
              onClick={() => { stopReadingRef.current = true; stopListening(); speechSynthesis.cancel(); readHighlights(); }}
              className="border border-yellow-400 px-5 py-3 rounded-lg flex items-center gap-2"
            >
              <Highlighter size={18} /> View Highlights ({highlights.length})
            </button>
          </div>

          <div className="bg-zinc-900 border border-yellow-400 rounded-xl p-8">
            <h1 className="text-3xl font-bold mb-2">{selectedPaper.title}</h1>
            <p className="text-gray-400">{selectedPaper.authors}</p>
            <p className="text-yellow-400 mt-1 mb-8">{selectedPaper.journal} • {selectedPaper.year}</p>

            {isReading && (
              <div className="mb-6 bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-4 py-2 text-yellow-400 text-sm animate-pulse">
                🔊 Reading aloud... say "highlight this line" to highlight the current sentence
              </div>
            )}

            <div className="space-y-8">
              {sections.map(({ key, label, text }) => (
                <div key={key}>
                  <h2 className="text-yellow-400 text-xl font-bold mb-3">{label}</h2>
                  {splitSentences(text).map((line, idx) => {
                    const isActive = highlightedSentence?.section === key && highlightedSentence?.idx === idx;
                    const isHighlighted = highlights.some(
                      (h) => h.text === line && h.section === key
                    );
                    return (
                      <p
                        key={`${key}-${idx}`}
                        className={`leading-relaxed mb-2 rounded-lg px-3 py-2 transition-all duration-300 ${
                          isActive
                            ? "bg-yellow-400/20 border border-yellow-400 text-white"
                            : isHighlighted
                            ? "bg-yellow-900/40 border border-yellow-600 text-yellow-100"
                            : "text-gray-300"
                        }`}
                      >
                        {isHighlighted && <span className="mr-2 text-yellow-400">★</span>}
                        {line}
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "highlights") {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => { stopListening(); speechSynthesis.cancel(); setScreen("reading"); startListening(); }}
              className="border border-yellow-400 px-5 py-3 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={18} /> Back to Paper
            </button>
            <h1 className="text-3xl font-bold">Highlights</h1>
          </div>

          {highlights.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center text-gray-400">
              <Highlighter size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-xl">No highlights yet.</p>
              <p className="mt-2 text-sm">Say "highlight this line" while a paper is being read.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {highlights.map((h, i) => (
                <div key={i} className="bg-zinc-900 border border-yellow-600 rounded-xl p-5">
                  <p className="text-yellow-400 text-sm font-bold mb-1">
                    {h.paperTitle} — {h.section.charAt(0).toUpperCase() + h.section.slice(1)}
                  </p>
                  <p className="text-white leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-gray-400 text-sm">
            <p>🎤 Say <span className="text-yellow-400">"read highlights"</span> to hear them aloud, or <span className="text-yellow-400">"go back"</span> to return</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
