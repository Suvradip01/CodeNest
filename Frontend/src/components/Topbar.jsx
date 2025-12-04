import React from 'react'

// Topbar: shows brand, language selection, theme toggle, and triggers AI review
// Props:
// - brand: app name label
// - language: current language value
// - onLanguageChange(lang, snippets): switches language and resets code using provided snippets
// - darkMode: use-dark-mode instance with .toggle() and .value
// - onReview: click handler to request AI review
// - snippets: language->code mapping used by onLanguageChange

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
        {/* Accessible theme toggle */}
        <button
          className="themeToggleBtn"
          onClick={darkMode.toggle}
          aria-label="Toggle theme"
          aria-pressed={darkMode.value}
        >
          {darkMode.value ? 'Dark Mode' : 'Light Mode'}
        </button>
        {/* Requests AI code review */}
        <button className="reviewBtn" onClick={onReview}>Review</button>
      </div>
    </div>
  )
}
