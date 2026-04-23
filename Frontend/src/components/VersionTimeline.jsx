import React, { useState } from 'react'
import { Clock, X, RotateCcw, GitCompare, Sparkles, Trash2, Tag, Loader2 } from 'lucide-react'
import DiffViewer from './DiffViewer'

// VersionTimeline — sliding drawer showing code snapshots with restore,
// compare, and AI-explain features.
// Props:
//   versions: array of { id, timestamp, language, code, label }
//   currentCode: string — current editor content
//   onRestore: (code, language) => void
//   onExplainDiff: (oldCode, newCode) => Promise<string>
//   onDelete: (id) => void
//   onClear: () => void
//   onLabel: (id, label) => void
//   onClose: () => void

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const LANG_COLOR = { javascript: '#f7df1e', python: '#3572A5', java: '#b07219', c: '#555555' }

export default function VersionTimeline({
  versions, currentCode, onRestore, onExplainDiff, onDelete, onClear, onLabel, onClose
}) {
  const [compareBase, setCompareBase] = useState(null) // version id to compare against
  const [diffTarget, setDiffTarget] = useState(null)   // version to compare to (or null = current)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [labelingId, setLabelingId] = useState(null)
  const [labelInput, setLabelInput] = useState('')
  const [showDiff, setShowDiff] = useState(false)

  const baseVersion = versions.find(v => v.id === compareBase)
  const targetCode = diffTarget ? versions.find(v => v.id === diffTarget)?.code : currentCode

  const handleExplain = async () => {
    if (!baseVersion || !targetCode) return
    setExplaining(true)
    setExplanation('')
    try {
      const text = await onExplainDiff(baseVersion.code, targetCode)
      setExplanation(text)
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 flex flex-col bg-black/85 backdrop-blur-2xl border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Version History</span>
          <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">{versions.length}</span>
        </div>
        <div className="flex items-center gap-1">
          {versions.length > 0 && (
            <button onClick={onClear} title="Clear all" className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diff Panel */}
      {showDiff && compareBase && (
        <div className="flex flex-col border-b border-white/10 bg-black/50 max-h-64 shrink-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-xs font-semibold text-white/60 flex items-center gap-2">
              <GitCompare className="w-3.5 h-3.5 text-purple-400" /> Diff View
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExplain}
                disabled={explaining}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 transition-colors disabled:opacity-50"
              >
                {explaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                AI Explain
              </button>
              <button onClick={() => { setShowDiff(false); setExplanation('') }} className="text-white/30 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <DiffViewer oldCode={baseVersion?.code || ''} newCode={targetCode || ''} />
          </div>
          {explanation && (
            <div className="px-4 py-3 text-xs text-white/70 border-t border-white/10 bg-violet-500/5 leading-relaxed prose prose-invert prose-sm max-w-none max-h-40 overflow-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Explanation</p>
              <div dangerouslySetInnerHTML={{ __html: explanation.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^- /gm, '• ') }} />
            </div>
          )}
        </div>
      )}

      {/* Version List */}
      <div className="flex-1 overflow-auto py-2">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Clock className="w-10 h-10 text-white/15" />
            <p className="text-xs text-white/25">No snapshots yet.<br />Run or review code to create versions.</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {/* Current (unsaved) indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs text-emerald-300 font-medium">Current (unsaved)</span>
              {compareBase && (
                <button
                  onClick={() => { setDiffTarget(null); setShowDiff(true) }}
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                >
                  Compare ↑
                </button>
              )}
            </div>

            {versions.map((v) => {
              const isBase = v.id === compareBase
              return (
                <div
                  key={v.id}
                  className={`group relative rounded-xl border p-3 transition-all duration-200 ${isBase ? 'bg-indigo-500/15 border-indigo-500/40' : 'bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15'}`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-px w-2 h-2 rounded-full border-2"
                    style={{ borderColor: LANG_COLOR[v.language] || '#888', background: 'transparent' }} />

                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Label */}
                      {labelingId === v.id ? (
                        <div className="flex gap-1 mb-1">
                          <input
                            autoFocus
                            value={labelInput}
                            onChange={e => setLabelInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { onLabel(v.id, labelInput); setLabelingId(null) } if (e.key === 'Escape') setLabelingId(null) }}
                            className="flex-1 text-[10px] bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-white outline-none"
                            placeholder="Add label..."
                          />
                        </div>
                      ) : v.label ? (
                        <p className="text-[10px] font-semibold text-indigo-300 mb-0.5">{v.label}</p>
                      ) : null}

                      <p className="text-[10px] text-white/30 mb-1">{timeAgo(v.timestamp)} · {v.language}</p>
                      <p className="text-xs text-white/50 truncate font-mono">{v.code.split('\n')[0].slice(0, 50)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRestore(v.code, v.language)}
                        title="Restore"
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setCompareBase(v.id); setShowDiff(true) }}
                        title="Compare"
                        className={`p-1.5 rounded-lg transition-colors ${isBase ? 'bg-indigo-500/30 text-indigo-300' : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'}`}
                      >
                        <GitCompare className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { setLabelingId(v.id); setLabelInput(v.label || '') }}
                        title="Label"
                        className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(v.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
