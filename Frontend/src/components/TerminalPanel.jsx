import React from 'react'

// TerminalPanel: displays execution output lines similar to a terminal
// Props:
// - output: array of strings representing stdout/stderr lines

export default function TerminalPanel({ output }) {
  return (
    <div className="panel">
      <div className="panelHeader">Terminal Output</div>
      <div className="panelBody panelBodySm">
        <div className="term">
          {output.map((line, i) => (<div key={i}>{line}</div>))}
        </div>
      </div>
    </div>
  )
}
