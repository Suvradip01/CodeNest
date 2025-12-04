import { useState } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import "highlight.js/styles/github-dark.css";
import './App.css'
import useDarkMode from 'use-dark-mode'
import Topbar from './components/Topbar'
import EditorPanel from './components/EditorPanel'
import ReviewPanel from './components/ReviewPanel'
import TerminalPanel from './components/TerminalPanel'
import PromptPanel from './components/PromptPanel'
import { getReview, runCode as runCodeApi, editCode } from './services/api'

function App() {
  const SNIPPETS = {
    javascript: `function sum(n){\n  return n + 1\n}\nconsole.log(sum(41))`,
    python: `def sum(n):\n    return n + 1\n\nprint(sum(41))`,
    java: `public class Main {\n  public static void main(String[] args){\n    System.out.println(sum(41));\n  }\n  static int sum(int n){ return n + 1; }\n}`,
    c: `#include <stdio.h>\nint sum(int n){ return n + 1; }\nint main(){ printf("%d\\n", sum(41)); return 0; }`
  }
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(SNIPPETS.javascript)
  const [review, setReview] = useState('')
  const [output, setOutput] = useState([])
  const [prompt, setPrompt] = useState('')

  const darkMode = useDarkMode(true, { className: 'dark', element: typeof document !== 'undefined' ? document.documentElement : undefined, onChange: (isDark) => { if (typeof document !== 'undefined') { document.documentElement.classList.toggle('light', !isDark) } } })





  async function reviewCode() {
    const data = await getReview(code)
    setReview(data)
  }

  async function runCode() {
    const res = await runCodeApi(code, language)
    setOutput(res.output || [])
  }

  function extractCode(text) {
    const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
    if (fence && fence[1]) return fence[1].trim()
    return text
  }

  async function applyPrompt() {
    const res = await editCode(prompt, code)
    const updated = typeof res === 'string' ? res : (res.text || '')
    setCode(extractCode(updated))
  }

  return (
    <div className="wrap">
      <Topbar
        brand="CodeNest"
        language={language}
        onLanguageChange={(lang, snippets) => { setLanguage(lang); setCode(snippets[lang]); setOutput([]); }}
        darkMode={darkMode}
        onReview={reviewCode}
        snippets={SNIPPETS}
      />
      <div className="main">
        <EditorPanel code={code} setCode={setCode} onRun={runCode} />
        <ReviewPanel review={review} />
        <TerminalPanel output={output} />
        <PromptPanel prompt={prompt} setPrompt={setPrompt} onApply={applyPrompt} />
      </div>
    </div>
  )
}



export default App
