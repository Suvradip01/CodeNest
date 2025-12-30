import React from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Bot } from 'lucide-react'

export default function ReviewPanel({ review }) {
  return (
    <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative">

      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            AI Review
          </span>
        </div>

        {review && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-300 uppercase">Live Analysis</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-6 overflow-auto flex-1 relative flex flex-col custom-scrollbar">
        {review ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="prose prose-sm max-w-none 
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-headings:text-foreground 
              prose-strong:text-purple-600 dark:prose-strong:text-purple-400
              prose-code:text-purple-600 dark:prose-code:text-purple-300 prose-code:bg-purple-100 dark:prose-code:bg-purple-500/10 prose-code:px-1.5 prose-code:rounded
              prose-pre:bg-muted dark:prose-pre:bg-black/40 prose-pre:border prose-pre:border-border">
              <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">

            {/* Floating Robot Container */}
            <div className="relative mb-8">
              {/* Outer Glow */}
              <div className="absolute -inset-10 bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse" />

              {/* SMOOTH FLOAT ANIMATION */}
              <div className="relative animate-[float_3s_ease-in-out_infinite]">
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                  }
                `}</style>
                <div className="p-7 rounded-[2.5rem] bg-gradient-to-b from-white/50 to-white/10 dark:from-white/[0.05] dark:to-transparent border border-black/5 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-sm transition-transform duration-700 hover:scale-110">
                  <Bot className="w-12 h-12 text-purple-600 dark:text-purple-400/80 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground/60 uppercase animate-pulse">
                Ready to analyze your code logic
              </p>

              <div className="flex gap-1.5 opacity-60">
                <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:200ms]" />
                <div className="w-1 h-1 rounded-full bg-purple-400 animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}