import React, { useState } from 'react'
import { useTheme } from '../components/theme-provider'
import { Moon, Sun, Code2, Play, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Topbar: shows brand, language selection, theme toggle, and triggers AI review
export default function Topbar({ brand = 'CodeNest', language, onLanguageChange, onReview, snippets }) {
  const { theme, setTheme } = useTheme()
  const [isLangOpen, setIsLangOpen] = useState(false)

  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
    { id: 'c', label: 'C' }
  ]

  const handleLanguageSelect = (langId) => {
    onLanguageChange(langId, snippets)
    setIsLangOpen(false)
  }

  return (
    <div className="sticky top-4 z-50 mx-4 my-2 flex items-center justify-between px-6 py-3 rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">

      {/* Icon Float Animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes arrow-flow {
          0% { transform: translateY(2px); opacity: 0; }
          50% { transform: translateY(-2px); opacity: 1; }
          100% { transform: translateY(-6px); opacity: 0; }
        }
      `}} />

      <div className="flex items-center gap-3 group cursor-pointer selection:bg-transparent">
        {/* Animated Logo Container */}
        <div className="relative p-2.5 bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 rounded-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden shadow-inner">
          <Code2 className="h-6 w-6 text-violet-600 dark:text-violet-400 animate-[float-icon_3s_ease-in-out_infinite]" />

          {/* Animated Arrows for "up down" effect requested */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute -right-1 top-1 w-1 h-1 bg-indigo-500 rounded-full animate-[arrow-flow_1.5s_infinite]" />
            <div className="absolute -left-1 bottom-1 w-1 h-1 bg-purple-500 rounded-full animate-[arrow-flow_1.5s_infinite_0.5s]" />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm">
            {brand}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Custom Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            onBlur={() => setTimeout(() => setIsLangOpen(false), 200)}
            className="flex items-center justify-between h-10 w-40 px-3 rounded-xl border border-transparent bg-secondary/50 hover:bg-secondary/70 text-sm font-medium transition-all backdrop-blur-sm group focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <span className="capitalize">{languages.find(l => l.id === language)?.label}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <div className={`absolute top-full right-0 mt-2 w-48 p-1 rounded-xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl origin-top-right transition-all duration-200 z-50 ${isLangOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`flex items-center justify-between w-full px-3 py-2 my-0.5 text-sm rounded-lg transition-colors ${language === lang.id ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium' : 'hover:bg-secondary/50 text-foreground/80'}`}
              >
                {lang.label}
                {language === lang.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full w-10 h-10 hover:bg-secondary/80 text-muted-foreground transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          <span className="sr-only">Toggle theme</span>
        </Button>


        <Button onClick={onReview} className="font-semibold shadow-lg shadow-primary/20">
          Review Code
        </Button>

      </div>
    </div>
  )
}