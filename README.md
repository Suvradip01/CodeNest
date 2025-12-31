# CodeNest

<div align="center">
  <img src="./AppPreview.png" alt="CodeNest Preview" width="100%" />
  <br />
  <h1>CodeNest</h1>
  <p><strong>AI-Powered Code Playground & Assistant</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-7.2-purple?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Node.js-Express_5-green?logo=nodedotjs" alt="Node.js" />
    <img src="https://img.shields.io/badge/AI-Gemini_2.5_Flash-orange?logo=google" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Piston_API-Code_Execution-yellow" alt="Piston API" />
  </p>
</div>

---

## 🚀 Overview

**CodeNest** is a modern, AI-enhanced code editor and playground that allows developers to write, execute, and review code in real-time. Built with a sleek React 19 frontend featuring Tailwind CSS 4 with glassmorphism design and a robust Node.js backend, it integrates **Google Gemini 2.5 Flash** for instant, intelligent code reviews and natural language code modifications. Code execution is powered by **Piston API**, eliminating the need for local compilers.

Whether you're learning a new language, debugging a script, or just experimenting, CodeNest provides a seamless environment with syntax highlighting, multiple language support, AI assistance, and a premium interactive UI with dark/light themes.

## ✨ Key Features

- **🌐 Multi-Language Support**: Write and execute code in **JavaScript**, **Python**, **Java**, and **C**.
- **🤖 AI Code Review**: Get instant, comprehensive architectural and security analysis powered by Google Gemini 2.5 Flash with retry logic for reliability.
- **✨ AI Code Editing**: Modify your code using natural language prompts (e.g., "Convert this function to use async/await").
- **⚡ Remote Code Execution**: Run code securely via **Piston API** - no local compilers needed, sandboxed execution in the cloud.
- **🎨 Premium Modern UI**: Beautiful glassmorphism design with floating panels, smooth gradients, interactive hover animations, and professional aesthetics.
- **🌓 Adaptive Themes**: Toggle between light and dark modes with synchronized syntax highlighting (PrismJS + Highlight.js).
- **📝 Rich Markdown Rendering**: View AI code reviews with syntax-highlighted code blocks and formatted markdown.

## 🛠️ Tech Stack

### Frontend
- **Framework & Build Tool**
  - React 19.2.0 - Modern UI library with latest features
  - Vite 7.2.4 - Next-generation frontend tooling
  - @vitejs/plugin-react 5.1.1 - Official React plugin for Vite

- **Styling & Design System**
  - Tailwind CSS 4.1.17 - Utility-first CSS framework
  - @tailwindcss/vite 4.1.17 - Tailwind CSS Vite plugin
  - @tailwindcss/postcss 4.1.17 - PostCSS integration
  - PostCSS 8.5.6 - CSS transformations
  - Vanilla CSS - Custom properties, CSS Grid, and glassmorphism aesthetics
  - class-variance-authority 0.7.1 - CVA for component variants
  - clsx 2.1.1 - Utility for constructing className strings
  - tailwind-merge 3.4.0 - Merge Tailwind CSS classes

- **Code Editor & Syntax Highlighting**
  - react-simple-code-editor 0.14.1 - Lightweight code editor component
  - PrismJS 1.30.0 - Syntax highlighting for JavaScript, Python, Java, C
  - Highlight.js 11.11.1 - Additional syntax highlighting for markdown

- **Markdown Rendering**
  - react-markdown 10.1.0 - Markdown component for React
  - rehype-highlight 7.0.2 - Syntax highlighting for code blocks in markdown

- **UI Components & Icons**
  - lucide-react 0.562.0 - Modern icon library
  - Custom theme provider with dark/light mode support

- **HTTP Client**
  - Axios 1.13.2 - Promise-based HTTP client

- **Development Tools**
  - ESLint 9.39.1 - JavaScript linting
  - @eslint/js 9.39.1 - ESLint JavaScript configs
  - eslint-plugin-react-hooks 7.0.1 - React Hooks linting rules
  - eslint-plugin-react-refresh 0.4.24 - React Refresh linting
  - globals 16.5.0 - Global variables for different environments


### Backend
- **Runtime & Server**
  - Node.js (CommonJS) - JavaScript runtime
  - Express 5.1.0 - Modern web framework for Node.js

- **AI Integration**
  - @google/genai 1.30.0 - Google Gemini 2.5 Flash AI model
    - AI-powered code reviews with architectural analysis
    - Natural language code editing
    - Retry logic with exponential backoff for rate limiting

- **Code Execution**
  - Piston API (emkc.org/api/v2/piston/execute) - Remote code execution service
  - Supports JavaScript (v18.15.0), Python (v3.10.0), Java (v15.0.2), C (v10.2.0)
  - Sandboxed execution environment

- **Middleware & Utilities**
  - CORS 2.8.5 - Cross-Origin Resource Sharing
  - dotenv 17.2.3 - Environment variable management

### Architecture & Patterns
- **Frontend Architecture**
  - Component-based architecture with React
  - Custom theme provider pattern
  - Service layer for API abstraction
  - Utility functions (cn helper for className merging)

- **Backend Architecture**
  - MVC-like pattern (Routes → Controllers → Services)
  - Service-oriented architecture for AI operations
  - RESTful API design

### Development Environment
- **Version Control**: Git (.gitignore configured)
- **Package Managers**: npm (package-lock.json)
- **Module Systems**: ESM (Frontend), CommonJS (Backend)
- **Languages**: Pure JavaScript/JSX (No TypeScript)
- **Environment**: Development server on localhost (Backend: 3000, Frontend: 5173)

## ⚙️ Prerequisites

Before running CodeNest, ensure you have the following installed:

1. **Node.js** (v18 or higher recommended) - For running both frontend and backend
2. **npm** - Package manager (comes with Node.js)
3. A **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/)

> **Note**: You do NOT need to install Python, Java, or C compilers locally. CodeNest uses **Piston API** for remote code execution, which provides sandboxed environments for all supported languages.

## 📦 Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/your-username/CodeNest.git
cd CodeNest
```

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory and add your Gemini API key:

```env
GOOGLE_GEMINI_KEY=your_actual_api_key_here
```

Start the backend server:

```bash
node server.js
# Server runs on http://localhost:3000
```

### 2. Frontend Setup

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd Frontend
npm install
```

Start the development server:

```bash
npm run dev
# Frontend runs on http://localhost:5173 (usually)
```

## 🎮 Usage

1. **Write Code**: Select a language (JS, Python, Java, C) from the top bar and start typing.
2. **Run Code**: Click the **Run** button to execute the script and see the output in the terminal panel.
3. **Get Review**: Click **Review Code** to receive an AI-generated analysis of your code, including improvements and explanations.
4. **Edit with AI**: Type a prompt in the bottom panel (e.g., "Optimize this loop") and click the send icon to have the AI rewrite your code safely.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any features, bug fixes, or improvements.
