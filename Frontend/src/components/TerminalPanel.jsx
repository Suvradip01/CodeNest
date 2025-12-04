import React from 'react'

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

