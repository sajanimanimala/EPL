# 🎙️ EchoEd

### Learning Assistant for the Visually Impaired

*A fully voice-navigated AI platform that enables blind and visually impaired users to learn, research, and stay productive entirely through speech.*

---

## 🌟 Overview

EchoEd is a voice-first AI learning assistant designed specifically for blind and visually impaired individuals. Unlike traditional educational platforms, EchoEd removes the need for screen readers, keyboards, and mouse interactions.

Every interaction is controlled through voice commands, allowing users to:

* Learn new concepts
* Conduct academic research
* Manage productivity tasks
* Receive AI-generated feedback
* Navigate the entire application hands-free

---

## 🌍 UN Sustainable Development Goals

### SDG 3 – Good Health & Well-Being

Promotes cognitive independence and mental well-being by reducing reliance on sighted assistance.

### SDG 4 – Quality Education

Provides equitable access to AI-powered educational tools through voice-first learning experiences.

### SDG 10 – Reduced Inequalities

Bridges the accessibility gap by offering advanced AI capabilities to visually impaired users.

---

## ✨ Features

### 🎓 Learning Mode

#### Explanation Mode

Ask any topic and receive a concise AI-generated explanation.

#### Active Recall

Generate voice-based quiz questions and receive immediate spoken feedback.

#### Teach Me Back

Explain a concept aloud and receive personalised evaluation from the AI assistant.

---

### 🔬 Research Mode

* Search academic papers using Gemini AI
* Explore recent research topics
* Read abstracts and conclusions aloud
* Voice-controlled paper navigation
* Highlight and save important content
* Review saved highlights anytime

---

### ⚡ Productivity Mode

#### Daily Planner

Navigate daily schedules through voice commands.

#### Focus Timer

Start and manage focus sessions using speech.

#### Smart Reminders

Create reminders with spoken instructions.

#### Revision Scheduler

Automatically schedule revision sessions using spaced repetition principles.

#### Performance Tracker

Track learning progress and assessment performance.

---

### ♿ Accessibility Features

* Fully voice-controlled interface
* High-contrast user interface
* Large and readable typography
* Real-time status indicators
* Audio feedback for all interactions
* No keyboard or mouse required

---

## 🏗️ System Architecture

### Voice Interaction Flow

```text
User Speech
      │
      ▼
Microphone Capture
      │
      ▼
FastAPI Backend
      │
      ▼
faster-whisper STT
      │
      ▼
Transcript Processing
      │
      ▼
Intent Detection
      │
 ┌────┼────┐
 ▼    ▼    ▼
Learning Research Productivity
      │
      ▼
Gemini AI Processing
      │
      ▼
Text-to-Speech
      │
      ▼
Audio Response
```

---

## 🛠️ Technology Stack

| Layer          | Technology            |
| -------------- | --------------------- |
| Frontend       | React 18 + TypeScript |
| Styling        | Tailwind CSS          |
| Backend        | FastAPI               |
| Speech-to-Text | faster-whisper        |
| Text-to-Speech | Web Speech API        |
| AI Engine      | Gemini 2.0 Flash      |
| Icons          | Lucide React          |

---

## 🚀 Installation

### Prerequisites

* Node.js 18+
* Python 3.9+
* Gemini API Key
* Working Microphone

### Clone Repository

```bash
git clone <repository-url>
cd EPL
```

### Install Frontend Dependencies

```bash
npm install
```

### Configure Gemini API Key

Update:

```ts
const GEMINI_API_KEY = "YOUR_API_KEY";
```

in:

```text
src/services/geminiLearning.ts
```

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

### Run Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Run Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🎤 Voice Commands

### Mode Selection

| Command      | Action                 |
| ------------ | ---------------------- |
| productivity | Open Productivity Mode |
| learning     | Open Learning Mode     |
| research     | Open Research Mode     |

### Learning Commands

| Command       | Action                      |
| ------------- | --------------------------- |
| explanation   | Start Explanation Mode      |
| recall        | Start Active Recall         |
| teach me back | Start Teach Me Back         |
| again         | Repeat previous explanation |
| menu          | Return to Learning Menu     |

### Research Commands

| Command       | Action                |
| ------------- | --------------------- |
| paper one     | Open first paper      |
| paper two     | Open second paper     |
| paper three   | Open third paper      |
| highlight     | Save current sentence |
| my highlights | Read saved highlights |

### Productivity Commands

| Command           | Action                   |
| ----------------- | ------------------------ |
| read my plan      | Read today's tasks       |
| start focus timer | Start timer              |
| set a reminder    | Create reminder          |
| schedule revision | Schedule revision        |
| how am I doing    | Read performance summary |

---

## 📁 Project Structure

```text
EPL/
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   ├── App.tsx
│   └── main.tsx
│
└── README.md
```

---

## 🔄 SDLC Journey

### Week 1

Requirements gathering, accessibility research, and architecture planning.

### Week 2

Implementation of Learning Mode and Research Mode.

### Week 3

Improved reliability, error handling, and speech processing.

### Week 4

Code refactoring, Productivity Mode development, and final polishing.

---

## ❤️ Team EchoEd

**Technology should work for everyone — not just those who can see the screen.**

