import React from 'react'
import Editor from 'react-simple-code-editor'
import prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'

// EditorPanel: code editing surface with syntax highlighting and Run button
// Props:
// - code: editor content
// - setCode: state setter for editor content
// - onRun: click handler to execute current code
// - language: selected language string ('javascript' | 'python' | 'java' | 'c')

export default function EditorPanel({ code, setCode, onRun, language = 'javascript' }) {
  const langKey = language === 'javascript' ? 'javascript'
    : language === 'python' ? 'python'
      : language === 'java' ? 'java'
        : language === 'c' ? 'c'
          : 'javascript'
  return (
    <div className="panel">
      <div className="panelHeader">Editor <button className="runBtn" onClick={onRun}>Run Code</button></div>
      <div className="panelBody">
        <div className="editorWrap">
          <Editor
            value={code}
            onValueChange={v => setCode(v)}
            // Highlight using Prism with the selected language grammar
            highlight={v => prism.highlight(v, prism.languages[langKey] || prism.languages.javascript, langKey)}
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
  )
}
