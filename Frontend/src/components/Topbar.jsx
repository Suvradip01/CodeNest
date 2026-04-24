import React, { useState } from 'react'
import { useTheme } from '../components/theme-provider'
import {
  Check,
  ChevronDown,
  Clock,
  Code2,
  FolderOpen,
  GitFork,
  Loader2,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Topbar({
  brand = 'CodeNest',
  language,
  onLanguageChange,
  onReview,
  snippets,
  showLivePanel,
  onToggleLive,
  showProjectSidebar,
  onToggleProjects,
  showVersionPanel,
  onToggleVersions,
  isVisualizing,
  onVisualize,
  onGoHome,
  session,
  authRequired = false,
  onOpenAuth,
  onLogout,
}) {
  const { theme, setTheme } = useTheme()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  const languages = [
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
    { id: 'c', label: 'C' },
  ]

  const handleLanguageSelect = (langId) => {
    onLanguageChange(langId, snippets)
    setIsLangOpen(false)
  }

  const handleReview = async () => {
    setIsReviewing(true)
    try {
      await onReview()
    } finally {
      setIsReviewing(false)
    }
  }

  const sessionLabel = session?.user?.name || session?.user?.email || 'Guest session'

  return (
    <div className="sticky top-4 z-50 mx-4 my-2 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] gap-2">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      ` }} />

      <div
        onClick={onGoHome}
        title="Back to Desktop"
        className="flex items-center gap-3 group cursor-pointer selection:bg-transparent shrink-0 hover:opacity-80 transition-opacity"
      >
        <div className="relative p-2.5 bg-gradient-to-br from-violet-500/10 to-blue-500/10 dark:from-violet-500/20 dark:to-blue-500/20 rounded-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden shadow-inner">
          <Code2 className="h-5 w-5 text-violet-600 dark:text-violet-400 animate-[float-icon_3s_ease-in-out_infinite]" />
        </div>
        <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 dark:from-violet-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent drop-shadow-sm hidden sm:block">
          {brand}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 flex-1 justify-center">
        <button
          onClick={onToggleProjects}
          title="Projects"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            showProjectSidebar
              ? 'bg-violet-500/20 border-violet-500/40 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
              : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Projects</span>
        </button>

        <button
          onClick={onToggleLive}
          title="Live AI Layer"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            showLivePanel
              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
              : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Live AI</span>
        </button>

        <button
          onClick={onToggleVersions}
          title="Version History"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            showVersionPanel
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
              : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden md:inline">History</span>
        </button>

        <button
          onClick={onVisualize}
          title="Visualize Code Flow"
          disabled={isVisualizing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:opacity-60"
        >
          {isVisualizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitFork className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">Visualize</span>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 dark:bg-white/[0.03] px-3 py-1.5">
          {session?.user ? (
            <>
              <UserRound className="h-3.5 w-3.5 text-emerald-400" />
              <span className="max-w-40 truncate text-xs font-medium text-foreground/90">{sessionLabel}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground/80">
                {authRequired ? 'Authentication required' : 'Guest workspace'}
              </span>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            onBlur={() => setTimeout(() => setIsLangOpen(false), 200)}
            className="flex items-center justify-between h-9 w-36 px-3 rounded-xl border border-transparent bg-secondary/50 hover:bg-secondary/70 text-xs font-medium transition-all backdrop-blur-sm group focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          >
            <span className="capitalize">{languages.find(item => item.id === language)?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          <div className={`absolute top-full right-0 mt-2 w-44 p-1 rounded-xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl origin-top-right transition-all duration-200 z-50 ${isLangOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
            {languages.map(item => (
              <button
                key={item.id}
                onClick={() => handleLanguageSelect(item.id)}
                className={`flex items-center justify-between w-full px-3 py-2 my-0.5 text-xs rounded-lg transition-colors ${language === item.id ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium' : 'hover:bg-secondary/50 text-foreground/80'}`}
              >
                {item.label}
                {language === item.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="h-7 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full w-9 h-9 hover:bg-secondary/80 text-muted-foreground transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {session?.user ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="rounded-full w-9 h-9 hover:bg-rose-500/10 hover:text-rose-500"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        ) : authRequired ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAuth}
            className="font-semibold text-xs"
          >
            Sign In
          </Button>
        ) : null}

        <Button
          onClick={handleReview}
          disabled={isReviewing}
          size="sm"
          className="font-semibold shadow-lg shadow-primary/20 text-xs"
        >
          {isReviewing ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Reviewing...</> : 'Review Code'}
        </Button>
      </div>
    </div>
  )
}
