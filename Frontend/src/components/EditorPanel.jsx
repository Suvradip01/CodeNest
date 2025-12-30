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
    <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] group relative">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 backdrop-blur-md">
        <span className="font-semibold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400"></span>
          Editor
          <span className="text-[10px] font-normal text-cyan-700 dark:text-cyan-400/80 bg-cyan-100/50 dark:bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-400/20">{language}</span>
        </span>
        <Button
          onClick={onRun}
          size="sm"
          className="group relative h-9 w-14 overflow-hidden rounded-lg bg-sky-100 text-sky-900 border border-sky-200 dark:bg-slate-900 dark:text-sky-400 dark:border-sky-500/40 transition-all duration-500 hover:border-sky-400 hover:bg-sky-200 dark:hover:bg-sky-500/10 hover:shadow-lg dark:hover:shadow-[0_0_25px_rgba(0,210,255,0.3)] active:scale-95"
        >
          {/* Slower, Premium Light Blue Warp Animation */}
          <style dangerouslySetInnerHTML={{
            __html: `
    @keyframes lightBlueWarp {
      0% { transform: translateX(-40px) scaleX(1.4); opacity: 0; filter: blur(3px); }
      20% { transform: translateX(0px) scaleX(1); opacity: 1; filter: blur(0px); }
      80% { transform: translateX(0px) scaleX(1); opacity: 1; filter: blur(0px); }
      100% { transform: translateX(40px) scaleX(1.4); opacity: 0; filter: blur(3px); }
    }
    .animate-blue-warp { 
      animation: lightBlueWarp 1.5s infinite cubic-bezier(0.45, 0, 0.55, 1); 
    }
  `}} />

          {/* Static Icon (Azure/Sky Blue) */}
          <Play
            className="w-4 h-4 transition-all duration-700 group-hover:opacity-0 group-hover:scale-150 group-hover:blur-md"
            fill="currentColor"
          />

          {/* Looping Icon (The "Light Blue" Warp Layer) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Play
              className="w-4 h-4 animate-blue-warp fill-sky-600 dark:fill-sky-400"
              style={{ filter: 'drop-shadow(0 0 5px rgba(0, 210, 255, 0.8))' }}
            />
          </div>
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
