import React from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Sparkles, Bot } from 'lucide-react'

// ReviewPanel: renders AI feedback as markdown, with syntax-highlighted code blocks
// Props:
// - review: markdown text returned from the backend

export default function ReviewPanel({ review }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-lg dark:shadow-2xl transition-all group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md">
        <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          AI Review
        </span>
        {review && <div className="text-[10px] text-purple-700 dark:text-purple-300/60 bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-500/20 animate-pulse">Live Analysis</div>}
      </div>
      <div className="p-5 overflow-auto flex-1 bg-transparent relative">
        <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted/50 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-border prose-code:text-purple-600 dark:prose-code:text-purple-300 prose-headings:text-foreground/90 prose-p:text-foreground/80">
          {review ? (
            <div className="animate-slide-up">
              <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-3 animate-pulse">
              <div className="p-4 rounded-full bg-muted/50 border border-border">
                <Sparkles className="w-8 h-8 opacity-50 text-muted-foreground" />
              </div>
              <p className="text-sm font-light tracking-wide text-muted-foreground/50">Ready to analyze your code logic...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
