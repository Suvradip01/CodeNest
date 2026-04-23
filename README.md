# 💻 CodeNest

<div align="center">
  <img src="./AppPreview.png" alt="CodeNest Preview" width="100%" />
  <br />
  <p><strong>The Final AI-Powered Code Playground</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-7.2-purple?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Node.js-Express_5-green?logo=nodedotjs" alt="Node.js" />
    <img src="https://img.shields.io/badge/AI-Gemini_2.5_Flash-indigo?logo=google" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Runner-Piston_API-yellow" alt="Piston API" />
  </p>
</div>

---

## 🚀 Overview

**CodeNest** is a stunning, high-performance web-based code execution environment that seamlessly merges a traditional IDE with an intelligent AI assistant. 

Moving away from the cluttered "AI chat" interfaces, CodeNest is hyper-focused. It provides a highly tactile, responsive editor where code is a physical object you can execute, analyze, and mutate instantly using natural language commands. 

The application utilizes **Google's Gemini 2.5 Flash** for deep architectural analysis and logic rewriting, and the **Piston API** to safely compile and run arbitrary user code in isolated cloud containers.

---

## ✨ Core Features

1. **⚡ Instant Cloud Execution**: Write JavaScript, Python, Java, or C and run it instantly. No local compilers, no Docker setup, no environment variables.
2. **🤖 Senior-Level AI Reviews**: Click "Review" to get a comprehensive markdown report. Gemini analyzes your Big-O time complexity, architectural patterns, security vulnerabilities, and adherence to SOLID principles.
3. **🪄 Natural Language Edits**: Select your code, type "Refactor this to be async" or "Handle edge cases for null inputs", and watch the AI safely rewrite your editor's content.
4. **🎨 Premium "Linear-style" UI**: A meticulous dark-mode UI with a single indigo accent color. Features staggered floating feature cards, custom CSS keyframe animations, glassmorphic panels, and glowing tooltips.
5. **📺 Live Terminal**: Standard output (`stdout`) and standard error (`stderr`) are piped directly from the execution sandbox into a realistic, custom-built terminal panel.

---

## 🏗️ Technical Architecture

CodeNest follows a clean, decoupled Client-Server architecture.

### 🌐 Frontend (React 19 + Tailwind 4)
The frontend is a Single Page Application (SPA) built for extreme responsiveness.
* **State Management**: Handled via React Hooks (`useState`, `useEffect`) at the topmost `<App />` component level and drilled down, keeping panels synchronized.
* **Styling**: Tailwind CSS v4 handles utility classes, while a highly customized `index.css` manages complex CSS variable themes and precise keyframe animations (like `card-bob`, `blink`, and `land-up`).
* **Editor**: Uses `react-simple-code-editor` combined with `PrismJS` for lightweight, lag-free syntax highlighting.
* **Component Tree**:
  * `LandingPage.jsx`: The animated hero entry point with staggering float animations.
  * `Topbar.jsx`: Global controls (Theme, Language, Review trigger).
  * `EditorPanel.jsx`: The raw coding surface.
  * `PromptPanel.jsx`: The NLP command interface.
  * `ReviewPanel.jsx`: Renders AI markdown using `react-markdown` + `rehype-highlight`.
  * `TerminalPanel.jsx`: Maps remote execution output to DOM nodes.

### ⚙️ Backend (Node.js + Express 5)
A lightweight proxy server that acts as a secure bridge between the frontend and third-party APIs.
* **Direct Routing**: Bypasses heavy MVC controllers in favor of direct Route `->` Service delegation (`ai.routes.js` `->` `ai.services.js`) for maximum speed.
* **Exponential Backoff**: The backend wraps the Gemini SDK in a custom retry mechanism (`generateWithRetry`). If the Google API rate-limits the app (429 errors), the server intelligently waits and retries rather than crashing the client.
* **Code Execution Proxy**: The `/code/run` endpoint translates frontend language selections (e.g., 'python') into Piston API parameters (version `3.10.0`, filename `script.py`), sends the payload, and sanitizes the response for the frontend terminal.

---

## 🔄 Data Lifecycle & Flow

1. **Execution Flow**: 
   `User clicks Run` -> `Frontend Axios POST /code/run` -> `Express Backend` -> `Piston Server (sandboxed Docker execution)` -> `stdout/stderr returned to Express` -> `Frontend TerminalPanel maps strings to green/red output lines.`

2. **Review Flow**:
   `User clicks Review` -> `Frontend Axios POST /ai/get-review` -> `Express Backend injects strict Markdown System Prompt` -> `Gemini 2.5 Flash analyzes code` -> `Structured Markdown returned to Frontend` -> `ReviewPanel parses and syntax-highlights the Markdown.`

---

## 📂 Project Structure

```text
CodeNest/
├── Frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx                 # Application state hub
│       ├── index.css               # Global theme variables & custom keyframes
│       ├── components/  
│       │   ├── LandingPage.jsx     # Animated entry sequence
│       │   ├── EditorPanel.jsx     # PrismJS text area
│       │   ├── TerminalPanel.jsx   # Live output console
│       │   ├── PromptPanel.jsx     # AI instruction input
│       │   ├── ReviewPanel.jsx     # AI markdown renderer
│       │   └── theme-provider.jsx  # Dark/Light mode context
│       └── services/
│           └── api.js              # Axios HTTP wrappers
│
└── Backend/
    ├── server.js                   # Application entry point (Port 3000)
    ├── package.json
    └── src/
        ├── app.js                  # Express middleware & direct /code/run logic
        ├── routes/
        │   └── ai.routes.js        # Defines POST /ai/get-review & /ai/edit-code
        └── services/
            └── ai.services.js      # Gemini 2.5 SDK logic & Exponential Backoff
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18+)
- **Google Gemini API Key** (Get it from Google AI Studio)

### 1. Backend

```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory:
```env
GOOGLE_GEMINI_KEY=your_actual_api_key_here
```
Run the server:
```bash
node server.js
# Runs on http://localhost:3000
```

### 2. Frontend

In a new terminal window:
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🔮 Future Roadmap (Differentiators)

While CodeNest currently excels as a playground, planned updates aim to push it into a unique category beyond standard LLMs:

* **The Strict Tech Interviewer**: An upcoming mode where the AI gives you a LeetCode problem, watches you code, forces you to optimize your Big-O complexity, and refuses to give you the direct answer.
* **Gamified Bug Hunts**: Timed challenges where the AI injects specific vulnerabilities (like race conditions or SQL injections) and you must patch them within 60 seconds to climb a global leaderboard.
* **Visual Execution State**: Integration with Mermaid.js to auto-generate architecture diagrams dynamically based on the code written in the editor.

---

<div align="center">
  <i>Built with absolute precision.</i>
</div>
