import React from 'react'
import { useTheme } from '../components/theme-provider'
import { Moon, Sun, Code2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

// Topbar: shows brand, language selection, theme toggle, and triggers AI review
export default function Topbar({ brand = 'CodeNest', language, onLanguageChange, onReview, snippets }) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Code2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {brand}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-32">
          <Select
            value={language}
            onChange={e => onLanguageChange(e.target.value, snippets)}
            className="h-9"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full w-9 h-9"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button onClick={onReview} className="font-semibold shadow-lg shadow-primary/20">
          Review Code
        </Button>
      </div>
    </div>
  )
}
