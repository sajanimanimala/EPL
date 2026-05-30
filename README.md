<div align="center">

# 🎙️ EchoEd
### AI-Powered Learning Assistant for the Visually Impaired

*A fully voice-navigated AI platform that enables blind and visually impaired users to learn, research, and stay productive through speech alone.*

[![SDG 3](https://img.shields.io/badge/UN%20SDG-3%20Good%20Health-4C9F38?style=for-the-badge)](https://sdgs.un.org/goals/goal3)
[![SDG 4](https://img.shields.io/badge/UN%20SDG-4%20Quality%20Education-C5192D?style=for-the-badge)](https://sdgs.un.org/goals/goal4)
[![SDG 10](https://img.shields.io/badge/UN%20SDG-10%20Reduced%20Inequalities-DD1367?style=for-the-badge)](https://sdgs.un.org/goals/goal10)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)
![Whisper](https://img.shields.io/badge/Whisper-STT-412991?logo=openai)

</div>

---

## 📖 Overview

EchoEd is a voice-first AI learning assistant designed specifically for blind and visually impaired users. Unlike traditional educational platforms, EchoEd eliminates the need for screen readers, keyboards, or touch interactions.

Every feature is controlled through voice commands, allowing users to:

- Learn new concepts
- Conduct academic research
- Manage daily productivity tasks
- Receive AI-generated feedback
- Navigate the entire application hands-free

---

## 🌍 UN Sustainable Development Goals

| Goal | Contribution |
|--------|-------------|
| SDG 3 – Good Health & Well-Being | Supports cognitive independence and mental well-being |
| SDG 4 – Quality Education | Provides accessible AI-powered learning opportunities |
| SDG 10 – Reduced Inequalities | Reduces the digital accessibility gap for visually impaired users |

---

# ✨ Features

## 🎙️ Learning Mode

### Explanation Mode
Ask any topic and receive a concise AI-generated explanation.

### Active Recall
Generate voice-based quiz questions and receive instant feedback.

### Teach Me Back
Explain a concept aloud and receive personalised evaluation.

---

## 🔬 Research Mode

- Search academic papers using Gemini AI
- Read abstracts and conclusions aloud
- Voice-controlled paper navigation
- Save important sentences using the **"highlight"** command
- Review saved highlights anytime

---

## ⚡ Productivity Mode

### Daily Planner
Navigate daily tasks entirely by voice.

### Focus Timer
Start timers using natural language commands.

### Smart Reminders
Create reminders with spoken instructions.

### Revision Scheduler
Automatically schedule spaced repetition sessions.

### Performance Tracking
Track quiz scores and learning progress.

---

## ♿ Accessibility Features

- Voice-first interaction
- High-contrast UI
- Large readable typography
- Audio feedback for every action
- Real-time status indicators
- No keyboard or mouse required

---

# 🏗️ System Architecture

## Voice Interaction Flow

```mermaid
flowchart TD
A([User Speaks]) --> B[Microphone Capture]
B --> C[FastAPI Backend]
C --> D[faster-whisper]
D --> E[Transcript]
E --> F[Intent Detection]
F --> G[Learning Mode]
F --> H[Research Mode]
F --> I[Productivity Mode]
G --> J[Gemini AI]
H --> J
I --> J
J --> K[Text To Speech]
K --> L([User Hears Response])



