import React from 'react'
import { Bug } from 'lucide-react'

// TerminalPanel: displays execution output lines similar to a terminal.
// Props:
// - output: array of strings representing stdout/stderr lines
// - hasError: boolean — true when stderr was detected
// - onDebug: () => void — triggers AI debug mode

export default function TerminalPanel({ output, hasError, onDebug }) {
  return (
    <div className={`bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative ${
      hasError
        ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
        : 'border-white/20 dark:border-white/10'
    }`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md">
        <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-red-500 animate-ping' : 'bg-emerald-500/50 animate-pulse'}`}></span>
          Terminal
          {hasError && <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-bold">ERR</span>}
        </span>
        <div className="flex items-center gap-2">
          {/* AI Debug button — only shown when there's an error */}
          {hasError && onDebug && (
            <button
              onClick={onDebug}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wide hover:bg-red-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Bug className="w-3 h-3" />
              Debug with AI
            </button>
          )}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>
        </div>
      </div>
      <div className="p-0 card-scroll-container custom-scrollbar bg-background dark:bg-black">
        <div className="font-mono text-sm p-4 space-y-1.5">
          {output.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground/40 italic animate-pulse p-2">
              <span className="text-emerald-600/50 dark:text-emerald-500/50">➜</span>
              Waiting for command execution...
            </div>
          ) : (
            output.map((line, i) => {
              const isErr = hasError && (line.includes('Error') || line.includes('Traceback') || line.includes('Exception') || line.includes('error:'))
              return (
                <div
                  key={i}
                  className={`group/line flex items-start gap-3 hover:bg-black/5 dark:hover:bg-white/5 rounded px-2 py-0.5 transition-colors animate-slide-up ${
                    isErr ? 'text-red-400' : 'text-emerald-800 dark:text-emerald-300/90'
                  }`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className={`opacity-40 select-none mt-0.5 text-xs shrink-0 ${isErr ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                    {isErr ? '✗' : '$'}
                  </span>
                  <span className="break-all leading-relaxed tracking-wide">{line}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
