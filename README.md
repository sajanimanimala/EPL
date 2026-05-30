Here's the full README in plain text:

---

# EchoEd
### Learning Assistant for Visually Impaired

A fully voice-navigated AI platform that lets blind and visually impaired users learn, research, and stay productive — entirely through speech.

---

## Table of Contents

- Product Overview
- UN SDG Global Impact
- Features
- System Architecture
- Tech Stack
- Installation Guide
- Voice Command Reference
- Project Structure
- SDLC Journey

---

## Product Overview

EchoEd is a voice-first AI learning assistant built for blind and visually impaired individuals. It requires no screen reading, no keyboard navigation, and no button presses. Every interaction — from selecting a mode to answering a quiz question to bookmarking a research paper — is driven entirely by the user's spoken voice.

The platform is built around three core modes:

Learning Mode — Ask EchoEd to explain any topic, test yourself with AI-generated recall questions, or teach a concept back and receive personalised feedback. All powered by Gemini AI, all navigated by voice.

Research Mode — Speak a research topic and EchoEd searches Google Scholar and IEEE for recent papers, reads them aloud sentence-by-sentence, and lets you bookmark key sentences by saying "highlight".

Productivity Mode — Manage your day through voice: read daily plans, start focus timers, set reminders, schedule revision sessions, and track learning performance over time.

EchoEd is designed for two overlapping user groups: fully blind users who rely entirely on audio output, and partially sighted users who benefit from the high-contrast, large-text visual interface that mirrors what the voice is saying.

---

## UN SDG Global Impact

SDG 3 — Good Health & Well-Being: Promotes mental well-being and cognitive independence for visually impaired individuals by reducing reliance on sighted assistance for everyday learning tasks.

SDG 4 — Quality Education: Provides equitable access to AI-powered education tools for a population historically excluded from standard EdTech platforms. Voice-driven quizzing, explanation, and research tools democratise self-directed learning.

SDG 10 — Reduced Inequalities: Directly addresses the digital accessibility gap. Blind users gain access to the same quality of AI learning tools available to sighted users, with no compromise in capability.

An estimated 253 million people worldwide live with vision impairment (WHO, 2023). EchoEd is built for them.

---

## Features

**Learning Mode**
- Explanation Mode — Say any topic; Gemini generates a clear 3–4 sentence spoken explanation
- Active Recall — AI generates 3 questions on your topic; answer by voice and get immediate spoken feedback per answer
- Teach Me Back — Explain a topic aloud; AI evaluates your explanation and gives warm, specific feedback

**Research Mode**
- Searches Google Scholar and IEEE for recent papers via Gemini web search
- Reads paper title, authors, year, journal aloud for each result
- Select a paper by saying "paper one / two / three"
- Reads abstract, introduction, and conclusion sentence-by-sentence with progress tracking
- Say "highlight" at any point to bookmark the currently-spoken sentence
- Review all saved highlights on demand

**Productivity Mode**
- Daily Plan Reader — Voice navigation through scheduled tasks; say "next", "repeat", "go back"
- Focus Timer — Speak a duration to start a timer; voice alert on completion
- Reminders — Dictate task and time; assistant reads back for confirmation before saving
- Revision Scheduler — Speak a topic and frequency; AI schedules spaced revision sessions
- Performance Tracker — Tracks quiz scores and teach-back ratings; say "how am I doing" for a spoken summary

**Accessibility-First UI**
- High-contrast black and gold design for partial sight visibility
- All text at minimum 20px
- Live status indicator: Speaking / Listening / Thinking / Ready
- Visual feedback mirrors exactly what the voice is saying

---

## System Architecture

**Voice Interaction Flow**

User Speaks → Browser Mic (recordAndSendAudio) → FastAPI Backend (/transcribe) → faster-whisper STT Model → Transcript Text → Voice Hook Intent Detection → Gemini API → AI Response Text → textToSpeech.ts (Web Speech API TTS) → User Hears Response → loop back to User Speaks

**Request Lifecycle**

```
User speaks
    ↓
recordAndSendAudio()        — 4 second mic capture in browser
    ↓
POST /transcribe            — FastAPI receives audio blob
    ↓
faster-whisper model        — Transcribes audio to text locally
    ↓
{ "text": "explain photosynthesis" }
    ↓
Intent detection in hook    — toLowerCase + keyword matching
    ↓
Gemini API call             — Structured prompt, plain text response
    ↓
speak(response)             — Promise-based TTS, resolves on onend
    ↓
Next listen() call          — Mic opens only AFTER speech finishes
```

---

## Tech Stack

Frontend Framework — React 18 + TypeScript — Component architecture, hooks, strict typing
Styling — Tailwind CSS — High-contrast accessible UI
Text-to-Speech — Web Speech API (SpeechSynthesisUtterance) — Browser-native TTS, Promise-wrapped
Speech-to-Text — MediaRecorder API + FastAPI backend — 4s audio capture, sent to Whisper
STT Model — faster-whisper (Python) — Local Whisper transcription
AI Engine — Google Gemini 2.0 Flash — Explanations, quiz generation, evaluation, web search
Backend — FastAPI + Uvicorn — /transcribe endpoint for audio processing
Icons — Lucide React — Accessible icon set

---

## Installation Guide

**Prerequisites**
- Node.js 18+
- Python 3.9+
- A Gemini API key — get one free at ai.google.dev
- A microphone connected to your machine

**Step 1 — Clone the Repository**
```
git clone <your-repo-url>
cd EPL
```

**Step 2 — Set Up the Frontend**
```
cd EPL
npm install
```
Open src/services/geminiLearning.ts and replace YOUR_GEMINI_API_KEY with your actual key.

**Step 3 — Set Up the Backend**
Open a new terminal window:
```
cd EPL/backend
python3 -m venv venv
source venv/bin/activate        (Mac/Linux)
venv\Scripts\activate           (Windows)
pip install -r requirements.txt
```
Note: faster-whisper downloads the Whisper model on first run (~150MB). Internet required for first launch.

**Step 4 — Run the Backend**
```
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Step 5 — Run the Frontend**
```
cd EPL
npm run dev
```
Open http://localhost:5173 in your browser.

**Step 6 — Allow Microphone Access**
When the app loads, click Allow when the browser asks for microphone permission. EchoEd cannot function without it.

**Troubleshooting**

Cannot connect to 127.0.0.1:8000 — Make sure the backend is running in a separate terminal
Microphone not working — Check browser permissions and allow microphone
Whisper slow on first run — Normal, model is downloading
ModuleNotFoundError: faster_whisper — Run pip install -r requirements.txt inside the activated venv
Gemini returns no results — Check your API key in geminiLearning.ts
TTS not speaking — Check system volume and browser is not muted

---

## Voice Command Reference

**Mode Selection**
"productivity" or "one" — Open Productivity Mode
"learning" or "two" — Open Learning Mode
"research" or "three" — Open Research Mode

**Learning Mode**
"explanation" — Enter Explanation Mode
"recall" — Enter Active Recall
"teach me back" — Enter Teach Me Back
"again" — Replay last explanation
"new topic" — Start with a different topic
"menu" — Return to Learning Mode menu

**Research Mode**
Any topic name — Search for papers
"paper one / two / three" — Select and read a paper
"highlight" — Save currently-spoken sentence
"stop reading" — Stop paper playback
"my highlights" — Hear all saved highlights
"new topic" — Search a different topic
"go back" — Return to mode selection

**Productivity Mode**
"read my plan" — Hear today's scheduled tasks
"start focus timer" + duration — Start a countdown timer
"set a reminder" — Dictate a reminder with time
"schedule revision" + topic — Schedule spaced revision sessions
"how am I doing" — Hear learning performance summary

---

## Project Structure

```
EPL/
├── backend/
│   ├── main.py                  — FastAPI app, /transcribe endpoint
│   ├── requirements.txt         — Python dependencies
│
└── EPL/
    └── src/
        ├── app/
        │   └── components/
        │       ├── shared/
        │       │   └── Voiceui.tsx
        │       ├── LearningMode.tsx
        │       ├── ResearchMode.tsx
        │       ├── ProductivityMode.tsx
        │       ├── ModeSelection.tsx
        │       └── StartScreen.tsx
        ├── hooks/
        │   ├── useLearningMode.ts
        │   └── useResearchMode.ts
        ├── services/
        │   ├── speech/
        │   │   ├── textToSpeech.ts
        │   │   └── speechToText.ts
        │   ├── geminiLearning.ts
        │   └── researchService.ts
        ├── App.tsx
        └── main.tsx
```

---

## SDLC Journey

Week 1 — Requirements & Design — User research, architecture design, voice interaction model defined
Week 2 — Core Build — Learning Mode + Research Mode implemented. Service/Hook/UI architecture established
Week 3 — Resilience & Edge Cases — TTS/STT race condition fixed, empty transcript retries, API error handling, isRunning guards
Week 4 — Refactoring & Polish — Spaghetti components split into clean layers, import paths audited, Productivity Mode added

**Key Engineering Decisions**

1. Promise-based TTS — speak() was originally void, so the microphone opened while the assistant was still talking, recording its own voice as user input. Wrapping in a Promise that resolves on utterance.onend fixed the entire voice loop.

2. Service / Hook / UI separation — Every mode follows the same pattern: services handle external calls, hooks own all state and async voice logic, UI components are visual feedback only. This made every bug easy to isolate and fix.

3. Parallel highlight listener — During paper reading, a continuous Web Speech API listener runs in parallel to catch "highlight" commands in real time, while recordAndSendAudio() handles all other sequential navigation.

4. Voice-only navigation — No button presses required for any navigational action. UI buttons exist only for partially sighted users who can see the screen.

---

Built with love by Team EchoEd

"Technology should work for everyone — not just those who can see the screen."
