// Core UI and styling imports
import { useState, useEffect, useRef, useCallback } from 'react'

// Theme management
import { ThemeProvider, useTheme } from './components/theme-provider'

// ── Existing modular UI components ────────────────────────────────────────
import LandingPage from './components/LandingPage'
import Topbar from './components/Topbar'
import EditorPanel from './components/EditorPanel'
import ReviewPanel from './components/ReviewPanel'
import TerminalPanel from './components/TerminalPanel'
import PromptPanel from './components/PromptPanel'

// ── New feature components ────────────────────────────────────────────────
import LiveHintsPanel from './components/LiveHintsPanel'
import ProjectSidebar from './components/ProjectSidebar'
import VersionTimeline from './components/VersionTimeline'
import DebugPanel from './components/DebugPanel'

// ── Custom hooks ──────────────────────────────────────────────────────────
import { useProjectStore } from './hooks/useProjectStore'
import { useVersionStore } from './hooks/useVersionStore'

// ── API service layer ─────────────────────────────────────────────────────
import {
  getReview,
  runCode as runCodeApi,
  editCode,
  liveCheck,
  explainDiff,
  debugFix,
  visualizeCode,
} from './services/api'

// Built-in sample code for quick language switching
const SNIPPETS = {
  javascript: `// Print "Hello, World!" to the console\nconsole.log("Hello, World!");`,
  python: `# Print "Hello, World!" to the console\nprint("Hello, World!")`,
  java: `/*\n * Print "Hello, World!"\n */\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `/*\n * Print "Hello, World!"\n */\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
}

// Utility: extract fenced code ```lang\n...``` from AI responses when present
function extractCode(text) {
  const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
  if (fence && fence[1]) return fence[1].trim()
  return text
}

// Detect if output lines contain error signals
function detectErrors(lines) {
  const errorPatterns = [
    /error/i, /exception/i, /traceback/i, /syntaxerror/i,
    /typeerror/i, /referenceerror/i, /segmentation fault/i,
    /undefined.*is not/i, /cannot read/i, /failed/i,
  ]
  return lines.some(l => errorPatterns.some(p => p.test(l)))
}

// Root application component
function App() {
  // ── View state ────────────────────────────────────────────────────────
  const [view, setView] = useState('landing')

  // ── Editor state ──────────────────────────────────────────────────────
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(SNIPPETS.javascript)
  const [review, setReview] = useState('')
  const [output, setOutput] = useState([])
  const [prompt, setPrompt] = useState('')

  // ── Feature 1: Live AI Layer ──────────────────────────────────────────
  const [showLivePanel, setShowLivePanel] = useState(false)
  const [liveHints, setLiveHints] = useState(null)
  const [isLiveLoading, setIsLiveLoading] = useState(false)
  const liveDebounceRef = useRef(null)

  // ── Feature 2: Project System ─────────────────────────────────────────
  const [showProjectSidebar, setShowProjectSidebar] = useState(false)
  const projectStore = useProjectStore()

  // ── Feature 3: Versioning ─────────────────────────────────────────────
  const [showVersionPanel, setShowVersionPanel] = useState(false)
  const versionStore = useVersionStore()

  // ── Feature 4: AI Debug Mode ──────────────────────────────────────────
  const [hasError, setHasError] = useState(false)
  const [stderrLines, setStderrLines] = useState([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState(null)

  // ── Feature 5: Visual Execution ───────────────────────────────────────
  const [mermaidDiagram, setMermaidDiagram] = useState('')
  const [isVisualizing, setIsVisualizing] = useState(false)

  useTheme()

  // ── Live AI: debounced call on code change ────────────────────────────
  useEffect(() => {
    if (!showLivePanel) return
    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current)
    liveDebounceRef.current = setTimeout(async () => {
      if (!code.trim()) { setLiveHints(null); return }
      setIsLiveLoading(true)
      try {
        const hints = await liveCheck(code, language)
        setLiveHints(hints)
      } catch (e) {
        const errorMsg = e?.response?.data?.error || e.message || 'Live check failed'
        setLiveHints({ error: errorMsg })
      } finally {
        setIsLiveLoading(false)
      }
    }, 2000)
    return () => clearTimeout(liveDebounceRef.current)
  }, [code, language, showLivePanel])

  // ── Project: auto-save code back to active file ───────────────────────
  useEffect(() => {
    if (projectStore.activeFile && projectStore.activeProjectId) {
      projectStore.updateFileContent(projectStore.activeProjectId, projectStore.activeFileId, code)
    }
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Feature 2: open a file from project sidebar ───────────────────────
  const handleFileOpen = useCallback((file, lang) => {
    setCode(file.content || SNIPPETS[lang] || '')
    setLanguage(lang)
    setOutput([])
    setHasError(false)
    setStderrLines([])
    setShowDebugPanel(false)
    setFixResult(null)
  }, [])

  // ── Review code ───────────────────────────────────────────────────────
  async function reviewCode() {
    versionStore.saveSnapshot(code, language, 'Before review')
    try {
      const data = await getReview(code)
      setReview(data)
    } catch (e) {
      const status = e?.response?.status
      const message =
        e?.response?.data?.error ||
        e?.response?.data ||
        e?.message ||
        'Request failed'
      setReview(`## Review unavailable\n\n**Status:** ${status || 'Unknown'}\n\n${String(message)}`)
    }
  }

  // ── Run code ──────────────────────────────────────────────────────────
  async function runCode() {
    // Save snapshot before run
    versionStore.saveSnapshot(code, language)

    const res = await runCodeApi(code, language)
    const lines = res.output || []
    const stderr = res.stderr || []
    setOutput(lines)

    // Debug mode detection
    const errDetected = (stderr.length > 0) || detectErrors(lines)
    setHasError(errDetected)
    setStderrLines(stderr.length > 0 ? stderr : lines.filter(l => detectErrors([l])))
    setShowDebugPanel(false)
    setFixResult(null)

    // Also save snapshot for versioning with exit code label
    if (res.exitCode !== undefined && res.exitCode !== 0) {
      versionStore.saveSnapshot(code, language, `Run failed (exit ${res.exitCode})`)
    }
  }

  // ── Apply AI prompt ───────────────────────────────────────────────────
  async function applyPrompt() {
    try {
      const res = await editCode(prompt, code)
      const updated = typeof res === 'string' ? res : (res.text || '')
      setCode(extractCode(updated))
    } catch (e) {
      const status = e?.response?.status
      const message =
        e?.response?.data?.error ||
        e?.response?.data ||
        e?.message ||
        'Request failed'
      setOutput([`AI edit failed (status ${status || 'unknown'}): ${String(message)}`])
      setHasError(true)
    }
  }

  // ── Feature 4: Auto-fix with AI ──────────────────────────────────────
  async function handleAutoFix() {
    if (!stderrLines.length && !hasError) return
    setIsFixing(true)
    try {
      const errorOutput = stderrLines.join('\n') || output.join('\n')
      const result = await debugFix(code, errorOutput, language)
      setFixResult(result)
      if (result.fixedCode) {
        versionStore.saveSnapshot(code, language, 'Before AI fix')
        setCode(result.fixedCode)
        setHasError(false)
        setOutput([])
      }
    } catch (e) {
      const status = e?.response?.status
      const message =
        e?.response?.data?.error ||
        e?.response?.data ||
        e?.message ||
        'Request failed'
      setFixResult({ errorType: 'RequestError', explanation: `Fix failed (status ${status || 'unknown'}): ${String(message)}`, fixedCode: '' })
    } finally {
      setIsFixing(false)
    }
  }

  // ── Feature 5: Visualize code ─────────────────────────────────────────
  async function handleVisualize() {
    setIsVisualizing(true)
    setMermaidDiagram('')
    try {
      const diagram = await visualizeCode(code, language)
      setMermaidDiagram(diagram)
    } catch (e) {
      const status = e?.response?.status
      const message =
        e?.response?.data?.error ||
        e?.response?.data ||
        e?.message ||
        'Request failed'
      setMermaidDiagram(`flowchart TD\nA["Visualization unavailable (status ${status || 'unknown'})."]`)
      console.error('Visualize failed:', message)
    } finally {
      setIsVisualizing(false)
    }
  }

  // ── Feature 3: Restore a snapshot ────────────────────────────────────
  function handleRestore(snapCode, snapLang) {
    versionStore.saveSnapshot(code, language, 'Before restore')
    setCode(snapCode)
    setLanguage(snapLang)
    setOutput([])
    setHasError(false)
    setShowVersionPanel(false)
  }

  // ── Landing page ──────────────────────────────────────────────────────
  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('dashboard')} />
  }

  return (
    <div
      className="h-screen bg-zinc-50 dark:bg-zinc-950 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden"
      style={{ animation: 'dashboard-enter 0.5s ease-out forwards' }}
    >
      <style>{`
        @keyframes dashboard-enter {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <Topbar
        brand="CodeNest"
        language={language}
        onLanguageChange={(lang, snippets) => {
          setLanguage(lang)
          setCode(snippets[lang])
          setOutput([])
          setHasError(false)
          setStderrLines([])
          setShowDebugPanel(false)
          setFixResult(null)
          setMermaidDiagram('')
        }}
        onReview={reviewCode}
        snippets={SNIPPETS}
        showLivePanel={showLivePanel}
        onToggleLive={() => setShowLivePanel(v => !v)}
        showProjectSidebar={showProjectSidebar}
        onToggleProjects={() => setShowProjectSidebar(v => !v)}
        showVersionPanel={showVersionPanel}
        onToggleVersions={() => setShowVersionPanel(v => !v)}
        isVisualizing={isVisualizing}
        onVisualize={handleVisualize}
      />

      {/* ── Main Layout ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 65px)' }}>

        {/* Feature 2: Project Sidebar */}
        {showProjectSidebar && (
          <ProjectSidebar
            store={projectStore}
            onFileOpen={handleFileOpen}
            onClose={() => setShowProjectSidebar(false)}
          />
        )}

        {/* Main editor area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-4 p-4 lg:p-6 overflow-hidden min-h-0 min-w-0 max-h-full">
          <EditorPanel
            code={code}
            setCode={setCode}
            onRun={runCode}
            language={language}
          />

          <ReviewPanel
            review={review}
            mermaidDiagram={mermaidDiagram}
            isVisualizing={isVisualizing}
          />

          {/* Terminal + Debug Panel stacked */}
          <div className="flex flex-col gap-3 overflow-hidden min-h-0">
            <div className={`transition-all duration-300 flex flex-col overflow-hidden min-h-0 ${showDebugPanel ? 'flex-1' : 'h-full'}`}>
              <TerminalPanel
                output={output}
                hasError={hasError}
                onDebug={() => setShowDebugPanel(true)}
              />
            </div>
            {showDebugPanel && (
              <DebugPanel
                debugInfo={hasError ? { errorLines: stderrLines.length ? stderrLines : output, code, language } : null}
                onAutoFix={handleAutoFix}
                onClose={() => { setShowDebugPanel(false); setFixResult(null) }}
                isFixing={isFixing}
                fixResult={fixResult}
              />
            )}
          </div>

          <PromptPanel prompt={prompt} setPrompt={setPrompt} onApply={applyPrompt} />
        </div>

        {/* Feature 3: Version Timeline (right drawer) */}
        {showVersionPanel && (
          <VersionTimeline
            versions={versionStore.versions}
            currentCode={code}
            onRestore={handleRestore}
            onExplainDiff={explainDiff}
            onDelete={versionStore.deleteSnapshot}
            onClear={versionStore.clearAll}
            onLabel={versionStore.labelSnapshot}
            onClose={() => setShowVersionPanel(false)}
          />
        )}
      </div>

      {/* Feature 1: Live AI Hints Panel (floating overlay) */}
      {showLivePanel && (
        <LiveHintsPanel
          hints={liveHints}
          isLoading={isLiveLoading}
          onClose={() => setShowLivePanel(false)}
        />
      )}
    </div>
  )
}

export default App
