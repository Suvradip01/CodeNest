import React, { useState } from 'react'
import { Zap, X, AlertTriangle, Lightbulb, Cpu, ChevronDown, ChevronUp } from 'lucide-react'

// LiveHintsPanel — floating side panel showing real-time AI lint warnings,
// suggestions, and complexity badge while the user types.
// Props:
//   hints: { warnings: [], suggestions: [], complexity: string } | null
//   isLoading: boolean
//   onClose: () => void

const COMPLEXITY_CONFIG = {
  'Simple': { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  'Moderate': { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-400' },
  'Complex': { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  'Very Complex': { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
}

export default function LiveHintsPanel({ hints, isLoading, onClose }) {
  const [collapsed, setCollapsed] = useState(false)

  const complexity = hints?.complexity || 'Simple'
  const cc = COMPLEXITY_CONFIG[complexity] || COMPLEXITY_CONFIG['Simple']
  const hasWarnings = hints?.warnings?.length > 0
  const hasSuggestions = hints?.suggestions?.length > 0

  return (
    <div className="fixed top-20 right-4 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/80 backdrop-blur-2xl animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-500/10 to-blue-500/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Live AI Layer</span>
          {isLoading && (
            <span className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3 max-h-[70vh] overflow-auto">
          {/* Complexity Badge */}
          {hints && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${cc.bg} ${cc.color}`}>
              <Cpu className="w-3.5 h-3.5" />
              <span>Complexity: {complexity}</span>
              <span className={`ml-auto w-2 h-2 rounded-full ${cc.dot} animate-pulse`} />
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70 px-1">Warnings</p>
              {hints.warnings.map((w, i) => (
                <div key={i} className={`flex gap-2 px-3 py-2 rounded-xl text-xs border ${
                  w.severity === 'error'
                    ? 'bg-red-500/10 border-red-500/20 text-red-300'
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {w.line && <span className="font-mono font-bold mr-1">L{w.line}:</span>}
                    {w.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {hasSuggestions && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400/70 px-1">Suggestions</p>
              {hints.suggestions.map((s, i) => (
                <div key={i} className="flex gap-2 px-3 py-2 rounded-xl text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-yellow-400" />
                  <span className="leading-relaxed">
                    {s.line && <span className="font-mono font-bold mr-1">L{s.line}:</span>}
                    {s.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {hints?.error && (
            <div className="flex gap-2 px-3 py-2 rounded-xl text-xs bg-red-500/10 border border-red-500/20 text-red-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{hints.error}</span>
            </div>
          )}

          {/* Empty state */}
          {hints && !hints.error && !hasWarnings && !hasSuggestions && (
            <div className="text-center py-4 text-xs text-emerald-400/70">
              <span className="text-lg block mb-1">✅</span>
              Code looks clean — no issues detected
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !hints && (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-8 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
