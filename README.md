# Sasahyog AI Health Intake Voice Agent 🩺🎙️

> **Technical Assessment Submission for Sasahyog Technologies**  
> A complete, demo-ready conversational AI voice assistant for preliminary health intake interviews. Built with React (Vite) + Node.js (Express) + WebSockets (`ws`).

---

## 🌟 Executive Overview

**Sasahyog AI Health Intake** is an end-to-end voice-driven preliminary health screening assistant. Designed to streamline patient intake before consultation with healthcare professionals, the AI interacts with users via real-time speech, extracts structured health metrics, adapts dynamically to multi-information responses, and generates a post-call clinical intake summary report.

> [!IMPORTANT]
> **Medical Disclaimer**: This application is a preliminary health information intake tool. It is **NOT** a diagnostic system and never provides medical diagnoses, prescriptions, or treatment advice.

---

## ✨ Key Features

- **🎙️ Real-time Voice Conversation (Push-To-Talk)**: Reliable turn-based audio streaming via WebSockets using the browser's native `MediaRecorder` and Web Audio API.
- **🗣️ Multi-Lingual Support**: Seamless voice interaction in both **English** and **Hindi** (with Devanagari/Hindi TTS synthesis).
- **🧠 Adaptive Conversation State Machine**: Dynamically tracks 7 intake stages (`GREETING` → `NAME` → `CHIEF_COMPLAINT` → `DURATION` → `SEVERITY` → `ASSOCIATED_SYMPTOMS` → `FOLLOW_UP` → `COMPLETED`).
- **🚀 Multi-Entity Turn Extraction**: If a user speaks multiple details in one sentence (e.g. *"My name is Rahul and I've had severe fever for three days"*), the AI extracts all facts at once and skips directly to missing details without asking redundant questions.
- **📄 Structured Medical Intake Report**: Automatically generates a structured report card containing patient metrics, narrative summary, and flagged follow-up items upon call termination.
- **⚡ Incomplete Call Handling**: If a user terminates early (e.g., after 1 turn), the system gracefully outputs an `INCOMPLETE` intake report with `"Not Provided"` placeholders without crashing or fabricating facts.
- **🛡️ Robust Failure Recovery**: Gracefully handles silent speech, microphone permission denials, missing API keys, LLM JSON parse issues, and WebSocket drops.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Audio Capture** | MediaRecorder API, Web Audio API |
| **Backend** | Node.js, Express, `ws` (WebSocket) |
| **Speech-to-Text (STT)** | OpenAI Whisper (`whisper-1`) |
| **Conversational LLM** | OpenAI GPT-4o-mini (Structured JSON outputs) |
| **Text-to-Speech (TTS)** | OpenAI TTS (`tts-1` with `alloy` & `shimmer` voices) |
| **Report Generator** | OpenAI GPT-4o-mini |

---

## 📐 Recommended System Architecture

```
React Frontend (Vite)
       │
       │  WebSocket Protocol (JSON + Base64 Audio)
       ▼
Node.js + Express Server (ws)
       │
       ├─────────────────┬──────────────────┐
       ▼                 ▼                  ▼
  STT Service       LLM Service        TTS Service
(OpenAI Whisper)   (GPT-4o-mini)       (OpenAI TTS)
       │                 │                  │
       │          State Machine             │
       └─────────────────┼──────────────────┘
                         ▼
                  React Audio Player ──► Speaker
                         │
                 [Call Ended Event]
                         │
                         ▼
               Report Generation LLM
                         │
                         ▼
                Structured Health UI
```

---

## 🔌 WebSocket Event Protocol

All communication between client and server uses structured JSON messages over standard WebSockets.

### Client → Server Events
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `START_CALL` | `{ language: "en" \| "hi" }` | Initializes a new session and requests AI greeting |
| `AUDIO_START` | `{ mimeType: "audio/webm" }` | Prepares server audio buffer for user turn |
| `AUDIO_CHUNK` | `{ audio: "base64String..." }` | Streams binary audio slice |
| `AUDIO_END` | `{}` | Triggers STT → LLM → TTS pipeline |
| `END_CALL` | `{}` | Finalizes session and triggers report generation |

### Server → Client Events
| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `CALL_STARTED` | `{ sessionId, language, initialMessage, audioPayload }` | Confirms session startup |
| `STATUS` | `{ status: "IDLE" \| "LISTENING" \| "PROCESSING" \| "SPEAKING" \| "GENERATING_REPORT" \| "COMPLETED" \| "ERROR" }` | Updates UI status badge |
| `TRANSCRIPT_UPDATE` | `{ role: "user" \| "assistant", text, timestamp }` | Appends live transcript turn |
| `AGENT_TEXT` | `{ text, stage, extracted }` | Delivers structured AI response |
| `AGENT_AUDIO` | `{ audioBase64, mimeType }` | Delivers synthesized speech MP3 payload |
| `REPORT_GENERATED` | `{ report: { ... } }` | Delivers post-call health summary |
| `ERROR` | `{ message }` | Delivers user-friendly error notifications |

---

## 📁 Project Structure

```
sasahyog-ai-health-intake/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CallScreen.jsx        # Voice call interface container
│   │   │   ├── CallControls.jsx      # Start/End Call & Push-to-Talk button
│   │   │   ├── VoiceVisualizer.jsx   # Dynamic audio waveform visualizer
│   │   │   ├── StatusIndicator.jsx   # Real-time state badge
│   │   │   ├── Transcript.jsx        # Live conversation bubble history
│   │   │   ├── LanguageSelector.jsx  # English / Hindi toggle
│   │   │   ├── HealthReport.jsx      # Post-call medical report card UI
│   │   │   └── ErrorMessage.jsx      # Dismissable error alert banner
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js       # Real-time WS client manager
│   │   │   └── useAudioRecorder.js   # Browser MediaRecorder audio hook
│   │   ├── services/
│   │   │   └── audioPlayer.js        # AI audio queue & Web Audio player
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express + WebSocket Node Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js                # Environment variable validator
│   │   ├── services/
│   │   │   ├── sttService.js         # Speech-to-Text service module
│   │   │   ├── llmService.js         # Conversational LLM module
│   │   │   ├── ttsService.js         # Text-to-Speech service module
│   │   │   └── reportService.js      # Structured report service module
│   │   ├── prompts/
│   │   │   ├── intakePrompt.js       # Intake system prompt templates
│   │   │   └── reportPrompt.js       # Report summary prompt templates
│   │   ├── state/
│   │   │   └── sessionManager.js     # In-memory session state machine
│   │   ├── websocket/
│   │   │   └── callHandler.js        # WebSocket routing & audio pipeline
│   │   └── server.js                 # HTTP & WS server entry point
│   ├── .env.example
│   └── package.json
│
├── package.json                # Root package for launching dev environment
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **OpenAI API Key**: Required for Whisper STT, GPT-4o-mini LLM, and OpenAI TTS.

### 1. Installation
Clone the repository and install all dependencies:
```bash
# Install root, server, and client dependencies
npm run install:all
```

### 2. Environment Configuration
Create a `.env` file inside the `server/` directory:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and add your OpenAI API key:
```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

### 3. Run Application Locally
Start both the Express backend and Vite frontend concurrently with a single command:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **WebSocket Endpoint**: `ws://localhost:3001`

---

## 🎭 Demo Scenario & Walkthrough

1. Open [http://localhost:5173](http://localhost:5173) in Chrome, Edge, or Firefox.
2. Select **English** or **हिंदी (Hindi)**.
3. Click **"Start Voice Health Screening"**. The AI assistant will greet you aloud.
4. **Hold to Speak**: Press and hold **"Hold or Click to Speak"**, speak your response into your microphone, and release.
5. **Multi-Entity Example**:
   - **User**: *"My name is Rahul and I've had a severe headache for two days."*
   - **AI**: *"Thank you Rahul. On a scale of 1 to 10, how severe is the headache?"*  
     *(Notice the AI extracted Name, Chief Complaint, and Duration in 1 turn and did NOT ask for them again!)*
6. **User**: *"About 7 out of 10."*
7. **AI**: *"Are you experiencing any other symptoms along with the headache?"*
8. **User**: *"I feel slightly nauseous."*
9. Click **"End Call"**. The system will immediately display the generated **Structured Health Screening Report** with all extracted metrics, summary narrative, and medical disclaimers.

---

## 🧪 Testing & Failure Scenarios

The system has been verified against 12 key resilience test scenarios:

1. **Normal English Flow**: Complete multi-turn intake from Greeting to Report.
2. **Normal Hindi Flow**: Full Hindi speech intake with Hindi TTS audio.
3. **Multi-Fact Turn**: User mentions Name + Concern + Duration in one turn.
4. **Vague Answer Handling**: User answers vaguely; AI asks a concise rating question.
5. **Empty Speech**: User releases button without speaking; AI politely prompts user to repeat.
6. **Early Call Termination**: User says 1 sentence and clicks "End Call"; system outputs an `INCOMPLETE` report without crashing.
7. **Missing API Key**: Server logs clear diagnostic instructions if `OPENAI_API_KEY` is missing.
8. **Mic Permission Denied**: Client shows an error banner if mic access is blocked.
9. **WebSocket Disconnect**: Automatically attempts reconnect and updates status UI.
10. **STT Error**: Gracefully prompts user to re-record.
11. **LLM Error**: Falls back to safe default intake question.
12. **TTS Failure**: Speech failure degrades gracefully to clear on-screen text.

---

## 🔒 Security & Privacy

- All third-party API keys remain strictly on the Node.js backend.
- API keys are never exposed to the frontend browser bundle.
- `.env` files are excluded from Git version control.

---

## 📄 License & Credits

Developed for **Sasahyog Technologies** Technical Assessment.  
Built with ❤️ using React, Node.js, Express, and OpenAI.
