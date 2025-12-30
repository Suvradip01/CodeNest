import React from 'react'

// TerminalPanel: displays execution output lines similar to a terminal
// Props:
// - output: array of strings representing stdout/stderr lines

export default function TerminalPanel({ output }) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md">
        <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></span>
          Terminal
        </span>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-glow-1"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-glow-2"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-glow-3"></div>
        </div>
      </div>
      <div className="p-0 overflow-auto flex-1 bg-background dark:bg-black relative">
        <div className="font-mono text-sm p-4 space-y-1.5 min-h-full">
          {output.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground/40 italic animate-pulse p-2">
              <span className="text-emerald-600/50 dark:text-emerald-500/50">➜</span>
              Waiting for command execution...
            </div>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className="group/line flex items-start gap-3 text-emerald-800 dark:text-emerald-300/90 hover:bg-black/5 dark:hover:bg-white/5 rounded px-2 py-0.5 transition-colors animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="opacity-40 select-none mt-0.5 text-xs text-emerald-600 dark:text-emerald-500 shrink-0">$</span>
                <span className="break-all leading-relaxed tracking-wide">{line}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
