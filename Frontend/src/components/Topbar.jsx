import React from 'react'

export default function Topbar({ brand = 'CodeNest', language, onLanguageChange, darkMode, onReview, snippets }) {
  return (
    <div className="topbar">
      <div className="brand">{brand}</div>
      <div className="controls">
        <select
          className="select"
          value={language}
          onChange={e => onLanguageChange(e.target.value, snippets)}
        >
          <option>javascript</option>
          <option>python</option>
          <option>java</option>
          <option>c</option>
        </select>
        <button
          className="themeToggleBtn"
          onClick={darkMode.toggle}
          aria-label="Toggle theme"
          aria-pressed={darkMode.value}
        >
          {darkMode.value ? 'Dark Mode' : 'Light Mode'}
        </button>
        <button className="reviewBtn" onClick={onReview}>Review</button>
      </div>
    </div>
  )
}

