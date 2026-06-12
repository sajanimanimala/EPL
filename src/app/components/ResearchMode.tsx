const API_URL = import.meta.env.VITE_API_URL;

import { useState, useEffect, useRef } from 'react';
import { Search, Bookmark, ArrowLeft, Mic, Play, Volume2, Highlighter } from 'lucide-react';

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
  id: number;
  text: string;
  section: string;
  paperTitle: string;
  savedAt: string;
}

function speakAndWait(text: string): Promise<void> {
  return new Promise((resolve) => {
    speechSynthesis.cancel();
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) { setTimeout(resolve, 400); return; }
    let i = 0;
    function next() {
      if (i >= sentences.length) { setTimeout(resolve, 600); return; }
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.rate = 0.82; u.pitch = 1; u.volume = 1;
      u.onend = () => { i++; setTimeout(next, 400); };
      u.onerror = () => { i++; setTimeout(next, 400); };
      speechSynthesis.speak(u);
    }
    next();
  });
}

function speakNow(text: string) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82; u.pitch = 1;
  speechSynthesis.speak(u);
}

async function recordAudio(ms: number): Promise<string> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    return new Promise((resolve) => {
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const form = new FormData();
        form.append("file", blob, "recording.webm");
        try {
          const res = await fetch(`${API_URL}/transcribe`, { method: "POST", body: form });
          const data = await res.json();
          resolve(data.text || "");
        } catch { resolve(""); }
      };
      recorder.start(100);
      setTimeout(() => recorder.stop(), ms);
    });
  } catch { return ""; }
}

async function fetchPapersFromBackend(topic: string): Promise<Paper[]> {
  const searchUrl = `${API_URL}/research/search?q=${encodeURIComponent(topic)}`;

  try {
    const res = await fetch(searchUrl);
    if (!res.ok) {
      const err = await res.text();
      console.error("Backend search error:", err);
      return [];
    }

    const data = await res.json();
    if (Array.isArray(data?.results) && data.results.length > 0) {
      return data.results;
    }

    console.warn("Backend returned no results.", data);
    return [];
  } catch (e) {
    console.error("fetchPapersFromBackend backend error:", e);
    return [];
  }
}

export default function ResearchMode({ onBack }: ResearchModeProps) {
  type Screen = "intro" | "listening" | "searching" | "papers" | "reading" | "highlights";

  const [screen, setScreen] = useState<Screen>("intro");
  const [status, setStatus] = useState("Starting...");
  const [transcript, setTranscript] = useState("");
  const [topic, setTopic] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [highlights, setHighlights] = useState<HighlightEntry[]>([]);
  const [currentSentence, setCurrentSentence] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<{ section: string; idx: number } | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const topicAttemptsRef = useRef(0);
  const papersRef = useRef<Paper[]>([]);
  const selectedPaperRef = useRef<Paper | null>(null);
  const highlightsRef = useRef<HighlightEntry[]>([]);
  const currentSentenceRef = useRef("");
  const currentSectionRef = useRef("");
  const highlightWindowRef = useRef(false);
  const highlightResolveRef = useRef<(() => void) | null>(null);
  const highlightCapturedRef = useRef(false);
  const stopReadingRef = useRef(false);
  const isReadingRef = useRef(false);

  useEffect(() => { papersRef.current = papers; }, [papers]);
  useEffect(() => { selectedPaperRef.current = selectedPaper; }, [selectedPaper]);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);
  useEffect(() => { currentSentenceRef.current = currentSentence; }, [currentSentence]);
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);
  useEffect(() => { isReadingRef.current = isReading; }, [isReading]);

  useEffect(() => {
    startFlow();
    return () => { stopListening(); speechSynthesis.cancel(); };
  }, []);

  // ══════════════════════════════════════
  // STEP 1 — Ask topic
  // ══════════════════════════════════════
  async function startFlow() {
    topicAttemptsRef.current = 0;
    setScreen("intro");
    setStatus("Speaking...");
    stopListening();
    speechSynthesis.cancel();

    await speakAndWait(
      "Welcome to Research Mode. Which topic would you like to research today?"
    );

    // try listening up to two times before giving up
    for (let attempt = 0; attempt < 2; attempt++) {
      setScreen("listening");
      setStatus("Listening...");

      // small pause to ensure TTS has fully stopped and mic can start
      try { speechSynthesis.cancel(); } catch (_) {}
      await new Promise(r => setTimeout(r, 400));

      const text = await listenOnce(10000);
      setTranscript(text);
      console.log("Topic heard:", text);

      if (text && text.trim().length >= 2) {
        const cleaned = text.trim();
        setTopic(cleaned);
        await doSearch(cleaned);
        return;
      }

      // failed attempt
      topicAttemptsRef.current += 1;
      if (topicAttemptsRef.current >= 2) {
        await speakAndWait("I could not understand your topic. Returning to mode selection.");
        setScreen("intro");
        setStatus("Idle");
        return;
      }

      await speakAndWait("I did not understand your topic. Please say it clearly.");
    }
  }

  // ══════════════════════════════════════
  // STEP 2 — Search
  // ══════════════════════════════════════
  async function doSearch(query: string) {
    setScreen("searching");
    setStatus("Searching...");

    await speakAndWait(`Searching for recent research papers on ${query}. Please wait.`);

    const results = await fetchPapersFromBackend(query);
    console.log("Search results:", results);

    if (!results || results.length === 0) {
      await speakAndWait(
        "I could not find papers on that topic. Please try again with a clearer topic name."
      );
      return startFlow();
    }

    papersRef.current = results;
    setPapers(results);
    setScreen("papers");
    setStatus("Ready");

    await speakAndWait(`I found ${results.length} papers on ${query}.`);

    for (let i = 0; i < results.length; i++) {
      await speakAndWait(
        `Paper ${i + 1}: ${results[i].title}. By ${results[i].authors}. Published in ${results[i].year} in ${results[i].journal}.`
      );
    }

    await speakAndWait(
      "Say read paper one or read paper two to listen to a paper."
    );

    startVoiceListener();
  }

  // ══════════════════════════════════════
  // STEP 3 — Read paper
  // ══════════════════════════════════════
  async function readPaper(paper: Paper) {
    stopListening();
    stopReadingRef.current = false;
    setSelectedPaper(paper);
    selectedPaperRef.current = paper;
    setScreen("reading");
    setIsReading(true);
    isReadingRef.current = true;
    setReadingProgress(0);
    setActiveSentenceIdx(null);

    await speakAndWait(
      `You selected Paper ${paper.id}: ${paper.title}. By ${paper.authors}. Published in ${paper.year}.`
    );
    await speakAndWait(
      "I will read the abstract, introduction, and conclusion. Say highlight this line, I like this line, or save this line at any time to save the current sentence to your highlights."
    );

    startHighlightListener();

    const sections = [
      { key: "abstract", label: "Abstract", text: paper.abstract },
      { key: "introduction", label: "Introduction", text: paper.introduction },
      { key: "conclusion", label: "Conclusion", text: paper.conclusion },
    ];

    let totalSentences = 0;
    const allSections: { key: string; label: string; sentences: string[] }[] = [];

    for (const s of sections) {
      const arr = s.text.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 0);
      allSections.push({ key: s.key, label: s.label, sentences: arr });
      totalSentences += arr.length;
    }

    let done = 0;

    for (const section of allSections) {
      if (stopReadingRef.current) break;

      setCurrentSection(section.key);
      currentSectionRef.current = section.key;
      await speakAndWait(section.label);

      for (let i = 0; i < section.sentences.length; i++) {
        if (stopReadingRef.current) break;

        setCurrentSentence(section.sentences[i]);
        currentSentenceRef.current = section.sentences[i];
        setActiveSentenceIdx({ section: section.key, idx: i });
        done++;
        setReadingProgress(Math.round((done / totalSentences) * 100));

        await speakAndWait(section.sentences[i]);

        // Give the user 5 seconds to say a highlight command, then continue.
        setStatus("Waiting for highlight...");
        highlightWindowRef.current = true;
        highlightCapturedRef.current = false;
        await waitForHighlightWindow(5000, highlightResolveRef);
        highlightWindowRef.current = false;
        highlightResolveRef.current = null;
        setStatus("Reading...");
      }
    }

    setIsReading(false);
    isReadingRef.current = false;
    setReadingProgress(100);
    stopListening();

    if (!stopReadingRef.current) {
      const count = highlightsRef.current.length;

      // Ask the user and wait explicitly for a yes/no answer
      const answer = await askYesNo(`I have finished reading. You have ${count} highlight${count !== 1 ? "s" : ""} saved. Would you like to hear your highlights? Say yes or no.`);

      if (answer === true) {
        // Read highlights aloud
        await readHighlights();
        // After reading highlights, go back to papers
        setScreen("papers");
        startVoiceListener();
      } else if (answer === false) {
        await speakAndWait("Okay. Going back to papers.");
        setScreen("papers");
        startVoiceListener();
      } else {
        await speakAndWait("I did not hear a clear yes or no. Returning to papers.");
        setScreen("papers");
        startVoiceListener();
      }
    }
  }

  // ══════════════════════════════════════
  // READ HIGHLIGHTS
  // ══════════════════════════════════════
  async function readHighlights() {
    setScreen("highlights");
    stopListening();

    const h = highlightsRef.current;

    if (h.length === 0) {
      await speakAndWait("You have no highlights saved yet. Going back to papers.");
      setScreen("papers");
      startVoiceListener();
      return;
    }

    await speakAndWait(`You have ${h.length} highlight${h.length > 1 ? "s" : ""} saved. Here they are.`);

    for (let i = 0; i < h.length; i++) {
      await speakAndWait(`Highlight ${i + 1} from ${h[i].section}: ${h[i].text}`);
    }

    await speakAndWait(
      "All highlights read. Say search new topic to research another topic, or say go back to return to mode selection."
    );

    startVoiceListener();
  }

  // ══════════════════════════════════════
  // HIGHLIGHT LISTENER — always on while reading
  // ══════════════════════════════════════
  function startHighlightListener() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopListening();

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true; // allow faster detection of short phrases
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      const cmd = (last[0].transcript || "").toLowerCase().trim();
      const isFinal = !!last.isFinal;
      setTranscript(cmd);
      console.log("Highlight listener:", cmd, "final:", isFinal);

      // react to both interim and final transcriptions for speed
      if (
        cmd.includes("highlight") ||
        cmd.includes("save this") ||
        cmd.includes("bookmark this") ||
        cmd.includes("i like this line") ||
        cmd.includes("i like this") ||
        cmd.includes("favorite this")
      ) {
        // Use the CURRENTLY BEING READ sentence (what you're hearing right now)
        const sentence = currentSentenceRef.current;
        const section = currentSectionRef.current;
        const paper = selectedPaperRef.current;

        if (highlightWindowRef.current && !highlightCapturedRef.current && sentence && sentence.trim().length > 3 && paper) {
          const already = highlightsRef.current.some(h => h.text === sentence && h.section === section);
          if (!already) {
            const newH: HighlightEntry = {
              id: Date.now(),
              text: sentence,
              section,
              paperTitle: paper.title,
              savedAt: new Date().toLocaleTimeString(),
            };
            const updated = [...highlightsRef.current, newH];
            highlightsRef.current = updated;
            setHighlights(updated);
            highlightCapturedRef.current = true;
            // quick audible confirmation
            speakNow("Saved to highlights.");

            if (highlightResolveRef.current) {
              highlightResolveRef.current();
            }
          } else {
            speakNow("Already highlighted.");
          }
        }
        return;
      }

      if (cmd.includes("stop reading") || (isFinal && cmd.includes("stop"))) {
        stopReadingRef.current = true;
        speechSynthesis.cancel();
        speakNow("Reading stopped.");
        return;
      }

      if (
        isFinal && (
          cmd.includes("go back") ||
          cmd.includes("mode selection") ||
          cmd.includes("go to mode selection") ||
          cmd.includes("got to mode selection") ||
          cmd.includes("go to mode")
        )
      ) {
        stopReadingRef.current = true;
        stopListening();
        speechSynthesis.cancel();
        onBack();
        return;
      }
    };

    rec.onerror = () => {
      setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (_) {}
        }
      }, 1000);
    };

    rec.onend = () => {
      if (isReadingRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (_) {}
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    setStatus("Listening...");
    try { rec.start(); } catch (_) {}
  }

  // ══════════════════════════════════════
  // NORMAL VOICE LISTENER
  // ══════════════════════════════════════
  function startVoiceListener() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopListening();

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      const cmd = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      setTranscript(cmd);
      console.log("Nav command:", cmd);
      handleNavCommand(cmd);
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

  // ══════════════════════════════════════
  // NAV COMMAND HANDLER
  // ══════════════════════════════════════
  function handleNavCommand(cmd: string) {
    if (
      cmd.includes("go back") ||
      cmd.includes("mode selection") ||
      cmd.includes("back to mode") ||
      cmd.includes("go to mode selection") ||
      cmd.includes("got to mode selection") ||
      cmd.includes("go to mode")
    ) {
      stopListening(); speechSynthesis.cancel(); onBack(); return;
    }

    if (cmd.includes("new topic") || cmd.includes("search again") || cmd.includes("search new") || cmd.includes("another topic")) {
      stopListening(); speechSynthesis.cancel(); startFlow(); return;
    }

    if (cmd.includes("highlights") || cmd.includes("my highlights") || cmd.includes("hear highlights")) {
      stopListening(); readHighlights(); return;
    }

    const p1 = cmd.includes("paper one") || cmd.includes("paper 1") || cmd.includes("read one") || cmd.includes("first paper") || cmd.includes("paper number one");
    const p2 = cmd.includes("paper two") || cmd.includes("paper 2") || cmd.includes("read two") || cmd.includes("second paper") || cmd.includes("paper number two");

    if (p1) {
      const paper = papersRef.current[0];
      if (paper) { stopListening(); readPaper(paper); }
      return;
    }

    if (p2) {
      const paper = papersRef.current[1];
      if (paper) { stopListening(); readPaper(paper); }
      else speakNow("Paper two is not available.");
      return;
    }
  }

  // ══════════════════════════════════════
  // SCREENS
  // ══════════════════════════════════════

  if (screen === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: "Neuton, serif" }}>
            Research Mode
          </h1>
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-10 w-full flex flex-col items-center gap-6">
            <Volume2 size={64} className="text-[#FFD700] animate-pulse" />
            <p className="text-[22px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
              🔊 Voice assistant is speaking...
            </p>
            <p className="text-gray-400 text-[16px] text-center">Microphone opens after the question</p>
          </div>
          <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
            className="w-full min-h-[55px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-colors font-bold"
            style={{ fontFamily: "Neuton, serif" }}>
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>
    );
  }

  if (screen === "listening") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: "Neuton, serif" }}>
            Research Mode
          </h1>
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-10 w-full flex flex-col items-center gap-6">
            <Mic size={64} className="text-[#FFD700] animate-pulse" />
            <p className="text-[22px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
              🎙️ Speak your research topic now
            </p>
            <p className="text-gray-400 text-[16px] text-center">10 seconds to speak</p>
            <span className="text-[#FFD700] text-[18px]">Status: {status}</span>
          </div>
          {transcript && <p className="text-gray-400 text-[14px] text-center">Heard: "{transcript}"</p>}
          <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
            className="w-full min-h-[55px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-colors font-bold"
            style={{ fontFamily: "Neuton, serif" }}>
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>
    );
  }

  if (screen === "searching") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-6">
        <div className="max-w-2xl w-full flex flex-col items-center gap-8">
          <h1 className="text-[48px] font-bold text-center" style={{ fontFamily: "Neuton, serif" }}>
            Research Mode
          </h1>
          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-lg p-10 w-full flex flex-col items-center gap-6">
            <Search size={64} className="text-[#FFD700] animate-pulse" />
            <p className="text-[22px] text-center" style={{ fontFamily: "Inter, sans-serif" }}>
              🔍 Searching for research papers...
            </p>
            <p className="text-[#FFD700] text-[18px]">Topic: {topic}</p>
          </div>
          <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
            className="w-full min-h-[55px] border-2 border-[#FFD700] text-[#FFD700] rounded-lg flex items-center justify-center gap-3 hover:bg-[#FFD700] hover:text-black transition-colors font-bold"
            style={{ fontFamily: "Neuton, serif" }}>
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>
    );
  }

  if (screen === "papers") {
    return (
      <div className="min-h-screen bg-black text-white px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[48px] font-bold" style={{ fontFamily: "Neuton, serif" }}>Research Mode</h1>
              <p className="text-[#FFD700] text-[18px]">Topic: {topic}</p>
            </div>
            <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
              className="border-2 border-[#FFD700] text-[#FFD700] px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
              style={{ fontFamily: "Neuton, serif" }}>
              <ArrowLeft size={20} /> Back
            </button>
          </div>

          <div className="bg-[#1a1a1a] border border-[#FFD700] rounded-lg p-4 flex items-center gap-4">
            <Mic className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"} size={22} />
            <div>
              <p className="text-[16px]" style={{ fontFamily: "Inter, sans-serif" }}>Status: {status}</p>
              {transcript && <p className="text-gray-400 text-[13px]">Heard: "{transcript}"</p>}
            </div>
          </div>

          <div className="space-y-5">
            {papers.map((paper, i) => (
              <div key={paper.id} className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-700">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-[18px] flex-shrink-0"
                    style={{ fontFamily: "Neuton, serif" }}>{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-[19px] font-bold" style={{ fontFamily: "Neuton, serif" }}>{paper.title}</p>
                    <p className="text-gray-400 text-[14px] mt-1">{paper.authors}</p>
                    <p className="text-[#FFD700] text-[13px] mt-1">{paper.journal} · {paper.year}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-[14px] leading-relaxed mb-4 line-clamp-2" style={{ fontFamily: "Inter, sans-serif" }}>
                  {paper.abstract}
                </p>
                <button onClick={() => { stopListening(); readPaper(paper); }}
                  className="w-full min-h-[60px] bg-[#FFD700] text-black rounded-lg flex items-center justify-center gap-3 font-bold text-[18px] hover:scale-105 transition-transform"
                  style={{ fontFamily: "Neuton, serif" }}>
                  <Play size={22} /> Read Paper {i + 1} Aloud
                </button>
              </div>
            ))}
          </div>

          <button onClick={() => { stopListening(); speechSynthesis.cancel(); startFlow(); }}
            className="w-full min-h-[60px] border-2 border-[#FFD700] text-[#FFD700] rounded-xl flex items-center justify-center gap-3 font-bold text-[18px] hover:bg-[#FFD700] hover:text-black transition-colors"
            style={{ fontFamily: "Neuton, serif" }}>
            <Search size={20} /> Search New Topic
          </button>

          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4">
            <p className="text-[#FFD700] font-bold mb-2 text-[14px]" style={{ fontFamily: "Neuton, serif" }}>Voice Commands</p>
            <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-300" style={{ fontFamily: "Inter, sans-serif" }}>
              <span>🎙️ "read paper one"</span>
              <span>🎙️ "read paper two"</span>
              <span>⭐ "my highlights"</span>
              <span>🔍 "search new topic"</span>
              <span>🔙 "go back to mode selection"</span>
            </div>
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
      <div className="min-h-screen bg-black text-white px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-[48px] font-bold" style={{ fontFamily: "Neuton, serif" }}>Reading Paper</h1>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  stopReadingRef.current = true;
                  stopListening();
                  speechSynthesis.cancel();
                  setIsReading(false);
                  isReadingRef.current = false;
                  setScreen("papers");
                  setTimeout(() => startVoiceListener(), 500);
                }}
                className="border-2 border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
                style={{ fontFamily: "Neuton, serif" }}>
                <ArrowLeft size={18} /> Papers
              </button>
              <button
                onClick={() => {
                  stopReadingRef.current = true;
                  stopListening();
                  speechSynthesis.cancel();
                  setIsReading(false);
                  isReadingRef.current = false;
                  readHighlights();
                }}
                className="border-2 border-[#FFD700] text-[#FFD700] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
                style={{ fontFamily: "Neuton, serif" }}>
                <Highlighter size={18} /> Highlights ({highlights.length})
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#FFD700] rounded-lg p-4 flex items-center gap-4">
            <Mic className="text-[#FFD700] animate-pulse" size={22} />
            <div>
              <p className="text-[15px]" style={{ fontFamily: "Inter, sans-serif" }}>
                {isReading ? `🔊 Reading ${currentSection}... ${readingProgress}%` : "Ready"}
              </p>
              {transcript && <p className="text-gray-400 text-[12px]">Heard: "{transcript}"</p>}
            </div>
          </div>

          {isReading && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-[#FFD700] h-2 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress}%` }} />
            </div>
          )}

          <div className="bg-[#1a1a1a] border-2 border-[#FFD700] rounded-xl p-6">
            <p className="text-[#FFD700] text-[14px] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
              {selectedPaper.authors} · {selectedPaper.year} · {selectedPaper.journal}
            </p>
            <p className="text-[22px] font-bold mb-6" style={{ fontFamily: "Neuton, serif" }}>
              {selectedPaper.title}
            </p>

            {sections.map(({ key, label, text }) => {
              const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
              return (
                <div key={key} className="mb-6">
                  <p className="text-[#FFD700] font-bold mb-3 text-[16px]" style={{ fontFamily: "Neuton, serif" }}>
                    {label}
                  </p>
                  <div className="space-y-2">
                    {sentences.map((sentence, idx) => {
                      const isActive = activeSentenceIdx?.section === key && activeSentenceIdx?.idx === idx;
                      const isHighlighted = highlights.some(h => h.text === sentence && h.section === key);
                      return (
                        <p key={`${key}-${idx}`}
                          className={`text-[14px] leading-relaxed px-3 py-2 rounded-lg transition-all duration-300 ${
                            isActive ? "bg-[#FFD700]/20 border border-[#FFD700] text-white"
                            : isHighlighted ? "bg-yellow-900/30 border border-yellow-600 text-yellow-100"
                            : "text-gray-300"
                          }`}
                          style={{ fontFamily: "Inter, sans-serif" }}>
                          {isHighlighted && <span className="mr-2 text-[#FFD700]">★</span>}
                          {sentence}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4">
            <p className="text-[#FFD700] font-bold mb-2 text-[14px]" style={{ fontFamily: "Neuton, serif" }}>
              While reading, say:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[13px] text-gray-300" style={{ fontFamily: "Inter, sans-serif" }}>
              <span>⭐ "highlight this line"</span>
              <span>⭐ "I like this line"</span>
              <span>⏹️ "stop reading"</span>
              <span>🔙 "go back"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HIGHLIGHTS SCREEN
  return (
    <div className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-[48px] font-bold" style={{ fontFamily: "Neuton, serif" }}>Highlights</h1>
          <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
            className="border-2 border-[#FFD700] text-[#FFD700] px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
            style={{ fontFamily: "Neuton, serif" }}>
            <ArrowLeft size={20} /> Back
          </button>
        </div>

        <div className="bg-[#1a1a1a] border border-[#FFD700] rounded-lg p-4 flex items-center gap-4">
          <Mic className={status.startsWith("Listening") ? "text-[#FFD700] animate-pulse" : "text-white"} size={22} />
          <p className="text-[16px]" style={{ fontFamily: "Inter, sans-serif" }}>Status: {status}</p>
        </div>

        {highlights.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-8 border border-gray-700 text-center">
            <Highlighter size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-[20px]">No highlights saved yet.</p>
            <p className="text-gray-600 text-[14px] mt-2">Say "highlight this line" while a paper is being read.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {highlights.map((h, i) => (
              <div key={h.id} className="bg-[#1a1a1a] rounded-xl p-6 border border-[#FFD700]">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[#FFD700] font-bold text-[15px]" style={{ fontFamily: "Neuton, serif" }}>
                    Highlight {i + 1} — {h.section.charAt(0).toUpperCase() + h.section.slice(1)}
                  </span>
                  <Bookmark size={18} className="text-[#FFD700]" />
                </div>
                <p className="text-[17px] leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{h.text}</p>
                <p className="text-gray-500 text-[12px] mt-1">{h.paperTitle} · {h.savedAt}</p>
                <button
                  onClick={() => {
                    speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance(h.text);
                    u.rate = 0.82;
                    speechSynthesis.speak(u);
                  }}
                  className="mt-3 w-full min-h-[50px] bg-white text-black rounded-lg flex items-center justify-center gap-2 font-bold text-[15px] hover:scale-105 transition-transform"
                  style={{ fontFamily: "Neuton, serif" }}>
                  <Play size={16} /> Play Highlight
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => { stopListening(); speechSynthesis.cancel(); startFlow(); }}
          className="w-full min-h-[65px] bg-[#FFD700] text-black rounded-xl flex items-center justify-center gap-3 font-bold text-[20px] hover:scale-105 transition-transform"
          style={{ fontFamily: "Neuton, serif" }}>
          <Search size={22} /> Search New Topic
        </button>

        <button onClick={() => { stopListening(); speechSynthesis.cancel(); onBack(); }}
          className="w-full min-h-[60px] border-2 border-[#FFD700] text-[#FFD700] rounded-xl flex items-center justify-center gap-3 font-bold text-[18px] hover:bg-[#FFD700] hover:text-black transition-colors"
          style={{ fontFamily: "Neuton, serif" }}>
          <ArrowLeft size={20} /> Back to Mode Selection
        </button>
      </div>
    </div>
  );
}

async function waitForHighlightWindow(ms: number, resolveRef: React.MutableRefObject<(() => void) | null>): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const timeout = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolveRef.current = null;
      resolve(false);
    }, ms);

    resolveRef.current = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      resolveRef.current = null;
      resolve(true);
    };
  });
}

async function listenOnce(ms: number): Promise<string> {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return recordAudio(ms);

  return new Promise((resolve) => {
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.lang = "en-US";
    let done = false;

    rec.onresult = (event: any) => {
      if (done) return;
      done = true;
      const text = event.results[event.results.length - 1][0].transcript || "";
      try { rec.stop(); } catch (_) {}
      resolve(text.trim());
    };

    rec.onerror = () => {
      if (done) return;
      done = true;
      try { rec.stop(); } catch (_) {}
      resolve("");
    };

    rec.onend = () => {
      if (done) return;
      done = true;
      resolve("");
    };

    try { rec.start(); } catch (e) { resolve(""); }

    setTimeout(() => {
      if (done) return;
      done = true;
      try { rec.stop(); } catch (_) {}
      resolve("");
    }, ms);
  });
}

// Helper: ask user a yes/no question and wait for clear yes/no response
async function askYesNo(
  promptText: string,
  speakAndWaitFn?: (text: string) => Promise<void>,
  listenOnceFn?: (ms: number) => Promise<string>,
  speakNowFn?: (text: string) => void,
  totalTimeout = 15000
): Promise<boolean | null> {
  // Use the globally available functions
  const speak = speakAndWaitFn || speakAndWait;
  const listen = listenOnceFn || listenOnce;
  const quickSpeak = speakNowFn || speakNow;

  // Speak the prompt first
  await speak(promptText);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const affirmative = /\b(yes|yeah|yep|sure|okay|ok|yup|yah|affirmative|correct|right)\b/i;
  const negative = /\b(no|nah|nope|not really|negative|never)\b/i;

  const start = Date.now();

  while (Date.now() - start < totalTimeout) {
    const ans = await listen(6000);
    if (!ans) {
      continue;
    }

    const lower = ans.toLowerCase();
    if (affirmative.test(lower)) {
      return true;
    }
    if (negative.test(lower)) {
      return false;
    }

    // unclear answer
    quickSpeak("Please say yes or no.");
  }

  return null;
}