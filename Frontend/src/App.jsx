// Core UI and styling imports
import { useState } from 'react'
// import "prismjs/themes/prism-tomorrow.css" // Removed in favor of index.css adaptive themes
// import "highlight.js/styles/github-dark.css" // Removed to prevent forced dark mode in light theme
// import './App.css' // App-wide styles removed

// Theme management
import { ThemeProvider, useTheme } from './components/theme-provider'

// Modular UI components
import Topbar from './components/Topbar'
import EditorPanel from './components/EditorPanel'
import ReviewPanel from './components/ReviewPanel'
import TerminalPanel from './components/TerminalPanel'
import PromptPanel from './components/PromptPanel'

// API service layer
import { getReview, runCode as runCodeApi, editCode } from './services/api'

// Root application component: wires together state, theming, panels, and API calls
function App() {
  // Built-in sample code for quick language switching in the editor
  const SNIPPETS = {
    javascript: `// Print "Hello, World!" to the console
console.log("Hello, World!");`,

    python: `# Print "Hello, World!" to the console
print("Hello, World!")`,

    java: `/*
 * Print "Hello, World!"
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,

    c: `/*
 * Print "Hello, World!"
 */
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
  }
  // Editor language, content, AI review markdown, terminal output, and prompt input
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(SNIPPETS.javascript)
  const [review, setReview] = useState('')
  const [output, setOutput] = useState([])
  const [prompt, setPrompt] = useState('')

  // Theme hook: adds 'dark' class to <html> by default and toggles complementary 'light' class
  const { theme, setTheme } = useTheme()

  // Request an AI review of the current editor code and render markdown
  async function reviewCode() {
    const data = await getReview(code)
    setReview(data)
  }

  // Execute the code for the selected language and render the output lines
  async function runCode() {
    const res = await runCodeApi(code, language)
    setOutput(res.output || [])
  }

  // Utility: extract fenced code ```lang\n...``` from AI responses when present
  function extractCode(text) {
    const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
    if (fence && fence[1]) return fence[1].trim()
    return text
  }

  // Apply a natural-language prompt to transform code via the backend
  async function applyPrompt() {
    const res = await editCode(prompt, code)
    const updated = typeof res === 'string' ? res : (res.text || '')
    setCode(extractCode(updated))
  }

  return (
    // App shell with topbar and main panel grid
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Top navigation: brand, language selector, theme toggle, review action */}
      <Topbar
        brand="CodeNest"
        language={language}
        onLanguageChange={(lang, snippets) => { setLanguage(lang); setCode(snippets[lang]); setOutput([]); }}
        onReview={reviewCode}
        snippets={SNIPPETS}
      />
      {/* Main content: editor, AI review, terminal output, and prompt entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-[2fr_1fr] gap-4 p-4 lg:p-6 h-[calc(100vh-65px)] overflow-hidden">
        <EditorPanel code={code} setCode={setCode} onRun={runCode} language={language} />
        <ReviewPanel review={review} />
        <TerminalPanel output={output} />
        <PromptPanel prompt={prompt} setPrompt={setPrompt} onApply={applyPrompt} />
      </div>
    </div>
  )
}



export default App
