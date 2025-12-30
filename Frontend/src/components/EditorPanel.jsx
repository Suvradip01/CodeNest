import React from 'react'
import Editor from 'react-simple-code-editor'
import prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'

// EditorPanel: code editing surface with syntax highlighting and Run button
// Props:
// - code: editor content
// - setCode: state setter for editor content
// - onRun: click handler to execute current code
// - language: selected language string ('javascript' | 'python' | 'java' | 'c')

export default function EditorPanel({ code, setCode, onRun, language = 'javascript' }) {
  const langKey = language === 'javascript' ? 'javascript'
    : language === 'python' ? 'python'
      : language === 'java' ? 'java'
        : language === 'c' ? 'c'
          : 'javascript'
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-lg dark:shadow-2xl transition-all hover:shadow-cyan-500/10 dark:hover:shadow-cyan-900/10 group">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md">
        <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
          Editor
          <span className="text-[10px] font-normal text-cyan-700 dark:text-cyan-400/80 bg-cyan-100/50 dark:bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-400/20">{language}</span>
        </span>
        <Button
          onClick={onRun}
          size="sm"
          className="h-8 px-4 font-medium shadow-lg shadow-emerald-500/10 dark:shadow-emerald-900/20 bg-emerald-600 hover:bg-emerald-700 text-white border-0 transition-all hover:scale-105 active:scale-95"
        >
          <Play className="w-3 h-3 mr-2" fill="currentColor" />
          Run
        </Button>
      </div>
      <div className="p-0 overflow-auto flex-1 relative group bg-transparent">
        <div className="h-full w-full bg-transparent transition-colors">
          <Editor
            value={code}
            onValueChange={v => setCode(v)}
            highlight={v => prism.highlight(v, prism.languages[langKey] || prism.languages.javascript, langKey)}
            padding={24}
            style={{
              fontFamily: '"Fira Mono", monospace', // Use a standard reliably aligned font
              fontSize: 14,
              minHeight: '100%',
              lineHeight: '24px', // Use fixed pixel value for exact alignment
              caretColor: '#22d3ee', // Cyan caret
            }}
            textareaClassName="focus:outline-none text-foreground whitespace-pre-wrap outline-none border-none"
            preClassName="whitespace-pre-wrap" // Match whitespace handling
          />
        </div>
      </div>
    </div>
  )
}
