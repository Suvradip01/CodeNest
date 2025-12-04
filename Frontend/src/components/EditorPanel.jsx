import React from 'react'
import Editor from 'react-simple-code-editor'
import prism from 'prismjs'

export default function EditorPanel({ code, setCode, onRun }) {
  return (
    <div className="panel">
      <div className="panelHeader">Editor <button className="runBtn" onClick={onRun}>Run Code</button></div>
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
  )
}

