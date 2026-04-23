import React, { useState } from 'react'
import { Bug, Wrench, X, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'

// DebugPanel — activates when code execution produces stderr.
// Shows error type, AI explanation, and one-click auto-fix.
// Props:
//   debugInfo: { errorLines: string[], code: string, language: string } | null
//   onAutoFix: () => Promise<void>
//   onClose: () => void
//   isFixing: boolean
//   fixResult: { errorType, explanation, fixedCode } | null

export default function DebugPanel({ debugInfo, onAutoFix, onClose, isFixing, fixResult }) {
  const [expanded, setExpanded] = useState(true)

  if (!debugInfo) return null

  return (
    <div className="relative rounded-2xl overflow-hidden border border-red-500/30 bg-black/70 backdrop-blur-xl shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-in slide-in-from-bottom-4 duration-300">
      {/* Animated glitch border */}
      <style>{`
        @keyframes glitch-border {
          0%, 100% { box-shadow: 0 0 15px rgba(239,68,68,0.2), 0 0 30px rgba(239,68,68,0.08); }
          50% { box-shadow: 0 0 25px rgba(239,68,68,0.35), 0 0 50px rgba(239,68,68,0.12); }
        }
        .debug-glow { animation: glitch-border 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="debug-glow flex items-center justify-between px-4 py-3 bg-red-500/10 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bug className="w-4 h-4 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-red-300">
            {fixResult ? `🛠 ${fixResult.errorType} — Fixed` : '🐛 AI Debug Mode Active'}
          </span>
          {fixResult && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Error Output */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Error Output
            </p>
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 font-mono text-xs text-red-300 space-y-1 max-h-28 overflow-auto">
              {debugInfo.errorLines.map((line, i) => (
                <div key={i} className="leading-relaxed">{line}</div>
              ))}
            </div>
          </div>

          {/* AI Explanation */}
          {fixResult && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1.5">AI Explanation</p>
              <p className="text-xs text-white/70 leading-relaxed">{fixResult.explanation}</p>
            </div>
          )}

          {/* Action */}
          <div className="flex items-center gap-3">
            {!fixResult && (
              <button
                onClick={onAutoFix}
                disabled={isFixing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 hover:shadow-red-900/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100"
              >
                {isFixing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing & Fixing...</>
                  : <><Wrench className="w-3.5 h-3.5" /> Auto Fix with AI</>
                }
              </button>
            )}
            {fixResult && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Code patched successfully!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
