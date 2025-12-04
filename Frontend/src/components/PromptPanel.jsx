import React from 'react'

export default function PromptPanel({ prompt, setPrompt, onApply }) {
  return (
    <div className="panel">
      <div className="panelHeader">Edit Prompt</div>
      <div className="panelBody panelBodySm">
        <div className="promptBar">
          <input
            className="prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Explain this code or suggest improvements..."
          />
          <button className="applyBtn" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}

