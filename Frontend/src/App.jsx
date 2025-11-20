import { useState, useEffect } from 'react'
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import prism from "prismjs"
import Markdown from "react-markdown"
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import axios from 'axios'
import './App.css'

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
  const [prompt, setPrompt] = useState('Improve and optimize this code')

  useEffect(() => {
    prism.highlightAll()
  }, [])

  useEffect(() => {
    setCode(SNIPPETS[language])
    setOutput([])
  }, [language])

  async function reviewCode() {
    const response = await axios.post('http://localhost:3000/ai/get-review', { code })
    setReview(response.data)
  }

  async function runCode() {
    const res = await axios.post('http://localhost:3000/code/run', { code, language })
    setOutput(res.data.output || [])
  }

  function extractCode(text){
    const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
    if (fence && fence[1]) return fence[1].trim()
    return text
  }

  async function applyPrompt() {
    const res = await axios.post('http://localhost:3000/ai/edit-code', { prompt, code })
    const updated = typeof res.data === 'string' ? res.data : (res.data.text || '')
    setCode(extractCode(updated))
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">CodeNest</div>
        <div className="controls">
          <select className="select" value={language} onChange={e => setLanguage(e.target.value)}>
            <option>javascript</option>
            <option>python</option>
            <option>java</option>
            <option>c</option>
          </select>
          <button className="reviewBtn" onClick={reviewCode}>Review</button>
        </div>
      </div>
      <div className="main">
        <div className="panel">
          <div className="panelHeader">Editor <button className="runBtn" onClick={runCode}>Run Code</button></div>
          <div className="panelBody">
            <div className="editorWrap">
              <Editor
                value={code}
                onValueChange={v => setCode(v)}
                highlight={v => prism.highlight(v, prism.languages.javascript, 'javascript')}
                padding={12}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 16,
                  height: '100%',
                  width: '100%',
                  overflow: 'auto'
                }}
              />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader">Code Review</div>
          <div className="panelBody">
            <div className="reviewContent">
              <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader">Terminal Output</div>
          <div className="panelBody panelBodySm">
            <div className="term">
              {output.map((line, i) => (<div key={i}>{line}</div>))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panelHeader">Edit Prompt</div>
          <div className="panelBody panelBodySm">
            <div className="promptBar">
              <input className="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Explain this code or suggest improvements..." />
              <button className="applyBtn" onClick={applyPrompt}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



export default App