import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Send, Loader2 } from 'lucide-react'

// PromptPanel: input and action to apply natural-language edits to code
// Props:
// - prompt: current prompt text
// - setPrompt: state setter for prompt
// - onApply: click handler to send prompt + code to backend

export default function PromptPanel({ prompt, setPrompt, onApply }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleApply = async () => {
    if (!prompt.trim() || isLoading) return
    setIsLoading(true)
    try {
      await onApply()
      setPrompt('') // Clear prompt on success
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleApply()
    }
  }

  return (
    <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <span className="font-semibold text-sm tracking-wide text-foreground/90 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          AI Assistant
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="relative flex-1">
          <textarea
            className="w-full h-full bg-muted/30 hover:bg-muted/50 focus:bg-background transition-all text-sm text-foreground/90 border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 placeholder:text-muted-foreground/40 scrollbar-thin scrollbar-thumb-muted-foreground/10 scrollbar-track-transparent"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change (e.g., 'Refactor this function to be async', 'Fix the bug in line 10')..."
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleApply}
            disabled={!prompt.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 transition-all active:scale-95"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
