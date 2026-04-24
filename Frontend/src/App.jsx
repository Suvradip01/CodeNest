import { useState, useEffect, useRef, useCallback } from 'react'

import LandingPage from './components/LandingPage'
import Desktop from './components/Desktop'
import Topbar from './components/Topbar'
import EditorPanel from './components/EditorPanel'
import ReviewPanel from './components/ReviewPanel'
import TerminalPanel from './components/TerminalPanel'
import PromptPanel from './components/PromptPanel'
import LiveHintsPanel from './components/LiveHintsPanel'
import ProjectSidebar from './components/ProjectSidebar'
import VersionTimeline from './components/VersionTimeline'
import DebugPanel from './components/DebugPanel'
import AuthDialog from './components/AuthDialog'

import { useProjectStore } from './hooks/useProjectStore'
import { useVersionStore } from './hooks/useVersionStore'

import {
  clearStoredSession,
  debugFix,
  editCode,
  fetchHealth,
  getCurrentUserApi,
  getReview,
  getStoredSession,
  liveCheck,
  loginUserApi,
  persistSession,
  registerUserApi,
  runCode as runCodeApi,
  visualizeCode,
  explainDiff,
} from './services/api'

const SNIPPETS = {
  javascript: `// Print "Hello, World!" to the console\nconsole.log("Hello, World!");`,
  python: `# Print "Hello, World!" to the console\nprint("Hello, World!")`,
  java: `/*\n * Print "Hello, World!"\n */\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `/*\n * Print "Hello, World!"\n */\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
}

function extractCode(text) {
  const fence = text.match(/```[a-zA-Z0-9]*\n([\s\S]*?)```/)
  if (fence && fence[1]) return fence[1].trim()
  return text
}

function detectErrors(lines) {
  const errorPatterns = [
    /error/i,
    /exception/i,
    /traceback/i,
    /syntaxerror/i,
    /typeerror/i,
    /referenceerror/i,
    /segmentation fault/i,
    /undefined.*is not/i,
    /cannot read/i,
    /failed/i,
  ]

  return lines.some(line => errorPatterns.some(pattern => pattern.test(line)))
}

function getApiErrorMessage(error, fallback = 'Request failed') {
  const status = error?.response?.status
  const message =
    error?.response?.data?.error ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    error?.message ||
    fallback

  return {
    status: status || 'unknown',
    message: typeof message === 'object' ? JSON.stringify(message) : String(message),
  }
}

function App() {
  const authRequired = false
  const initialSession = useRef(getStoredSession())
  const [view, setView] = useState('landing')
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(SNIPPETS.javascript)
  const [review, setReview] = useState('')
  const [output, setOutput] = useState([])
  const [prompt, setPrompt] = useState('')
  const [showLivePanel, setShowLivePanel] = useState(false)
  const [liveHints, setLiveHints] = useState(null)
  const [isLiveLoading, setIsLiveLoading] = useState(false)
  const [showProjectSidebar, setShowProjectSidebar] = useState(false)
  const [showVersionPanel, setShowVersionPanel] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [stderrLines, setStderrLines] = useState([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState(null)
  const [mermaidDiagram, setMermaidDiagram] = useState('')
  const [isVisualizing, setIsVisualizing] = useState(false)
  const [authConfig, setAuthConfig] = useState({ loading: true, required: true })
  const [session, setSession] = useState(initialSession.current)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const liveDebounceRef = useRef(null)

  const workspaceEnabled = Boolean(session?.token)
  const projectStore = useProjectStore({ enabled: workspaceEnabled })
  const versionStore = useVersionStore()
  const activeFile = projectStore.activeFile
  const activeProjectId = projectStore.activeProjectId
  const activeFileId = projectStore.activeFileId
  const updateFileContent = projectStore.updateFileContent

  useEffect(() => {
    let ignore = false

    async function bootstrap() {
      try {
        await fetchHealth()
        if (!ignore) {
          setAuthConfig({
            loading: false,
            required: true,
          })
        }
      } catch (error) {
        console.error('Health check failed:', error)
        if (!ignore) {
          setAuthConfig({ loading: false, required: true })
        }
      }

      if (!initialSession.current?.token) return

      try {
        const user = await getCurrentUserApi()
        if (ignore) return

        const hydratedSession = {
          ...initialSession.current,
          user,
        }
        persistSession(hydratedSession)
        setSession(hydratedSession)
      } catch (error) {
        console.error('Session restore failed:', error)
        clearStoredSession()
        if (!ignore) {
          setSession(null)
        }
      }
    }

    bootstrap()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!session?.token && view !== 'landing') {
      setView('landing')
      setAuthMode('login')
      setIsAuthOpen(true)
      setAuthError('Sign in or create an account to continue.')
    }
  }, [session?.token, view])


  useEffect(() => {
    if (!showLivePanel) return

    if (liveDebounceRef.current) clearTimeout(liveDebounceRef.current)

    liveDebounceRef.current = setTimeout(async () => {
      if (!code.trim()) {
        setLiveHints(null)
        return
      }

      setIsLiveLoading(true)
      try {
        const hints = await liveCheck(code, language)
        setLiveHints(hints)
      } catch (error) {
        const { message } = getApiErrorMessage(error, 'Live check failed')
        setLiveHints({ error: message })
      } finally {
        setIsLiveLoading(false)
      }
    }, 2000)

    return () => clearTimeout(liveDebounceRef.current)
  }, [code, language, showLivePanel])

  const lastSavedCode = useRef(code)
  const saveDebounceRef = useRef(null)
  const isSaving = useRef(false)
  
  useEffect(() => {
    if (!activeFileId || !activeProjectId || isSaving.current) return
    if (code === lastSavedCode.current) return

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)

    saveDebounceRef.current = setTimeout(async () => {
      try {
        isSaving.current = true
        lastSavedCode.current = code
        await updateFileContent(activeProjectId, activeFileId, code)
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        isSaving.current = false
      }
    }, 2000)

    return () => clearTimeout(saveDebounceRef.current)
  }, [activeFileId, activeProjectId, code]) // Removed updateFileContent from deps as it is stable

  const openAuth = useCallback((mode = 'login') => {
    setAuthMode(mode)
    setAuthError('')
    setIsAuthOpen(true)
  }, [])

  const handleLaunchWorkspace = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('register')
      return
    }

    setView('desktop')
  }, [authConfig.loading, openAuth, session?.token])

  const handleLaunchEditor = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('login')
      return
    }

    setView('dashboard')
  }, [authConfig.loading, openAuth, session?.token])

  const handleAuthSubmit = useCallback(async ({ mode, name, email, password }) => {
    setIsSubmittingAuth(true)
    setAuthError('')

    try {
      const nextSession = mode === 'register'
        ? await registerUserApi({ name, email, password })
        : await loginUserApi({ email, password })

      persistSession(nextSession)
      setSession(nextSession)
      setIsAuthOpen(false)

      if (view === 'landing') {
        setView('desktop')
      }
    } catch (error) {
      const { message } = getApiErrorMessage(error, 'Authentication failed')
      setAuthError(message)
    } finally {
      setIsSubmittingAuth(false)
    }
  }, [view])

  const handleLogout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setView('landing')
    setReview('')
    setOutput([])
    setPrompt('')
    setShowProjectSidebar(false)
    setShowVersionPanel(false)
    setShowLivePanel(false)
    setLiveHints(null)
    setHasError(false)
    setStderrLines([])
    setShowDebugPanel(false)
    setFixResult(null)
    setMermaidDiagram('')
    projectStore.reset()
  }, [projectStore])

  const handleFileOpen = useCallback((file, nextLanguage) => {
    const nextCode = file.content || SNIPPETS[nextLanguage] || ''
    setCode(nextCode)
    lastSavedCode.current = nextCode
    setLanguage(nextLanguage)
    setOutput([])
    setHasError(false)
    setStderrLines([])
    setShowDebugPanel(false)
    setFixResult(null)
  }, [])

  const reviewCode = useCallback(async () => {
    versionStore.saveSnapshot(code, language, 'Before review')
    try {
      const data = await getReview(code)
      setReview(data)
    } catch (error) {
      const { status, message } = getApiErrorMessage(error)
      setReview(`## Review unavailable\n\n**Status:** ${status}\n\n${message}`)
    }
  }, [code, language, versionStore])

  const runCode = useCallback(async () => {
    versionStore.saveSnapshot(code, language)

    try {
      const result = await runCodeApi(code, language)
      const lines = result.output || []
      const stderr = result.stderr || []

      setOutput(lines)
      const errDetected = stderr.length > 0 || detectErrors(lines)
      setHasError(errDetected)
      setStderrLines(stderr.length > 0 ? stderr : lines.filter(line => detectErrors([line])))
      setShowDebugPanel(false)
      setFixResult(null)

      if (result.exitCode !== undefined && result.exitCode !== 0) {
        versionStore.saveSnapshot(code, language, `Run failed (exit ${result.exitCode})`)
      }
    } catch (error) {
      const { status, message } = getApiErrorMessage(error, 'Execution failed')
      setOutput([`Execution failed (status ${status}): ${message}`])
      setHasError(true)
      setStderrLines([message])
    }
  }, [code, language, versionStore])

  const applyPrompt = useCallback(async () => {
    try {
      const result = await editCode(prompt, code)
      const updated = typeof result === 'string' ? result : (result.text || '')
      setCode(extractCode(updated))
    } catch (error) {
      const { status, message } = getApiErrorMessage(error)
      setOutput([`AI edit failed (status ${status}): ${message}`])
      setHasError(true)
    }
  }, [code, prompt])

  const handleAutoFix = useCallback(async () => {
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
    } catch (error) {
      const { status, message } = getApiErrorMessage(error)
      setFixResult({
        errorType: 'RequestError',
        explanation: `Fix failed (status ${status}): ${message}`,
        fixedCode: '',
      })
    } finally {
      setIsFixing(false)
    }
  }, [code, hasError, language, output, stderrLines, versionStore])

  const handleVisualize = useCallback(async () => {
    setIsVisualizing(true)
    setMermaidDiagram('')
    try {
      const diagram = await visualizeCode(code, language)
      setMermaidDiagram(diagram)
    } catch (error) {
      const { status, message } = getApiErrorMessage(error)
      setMermaidDiagram(`flowchart TD\nA["Visualization unavailable (status ${status})."]`)
      console.error('Visualize failed:', message)
    } finally {
      setIsVisualizing(false)
    }
  }, [code, language])

  const handleRestore = useCallback((snapshotCode, snapshotLanguage) => {
    versionStore.saveSnapshot(code, language, 'Before restore')
    setCode(snapshotCode)
    setLanguage(snapshotLanguage)
    setOutput([])
    setHasError(false)
    setShowVersionPanel(false)
  }, [code, language, versionStore])

  if (view === 'landing' || !session?.token) {
    return (
      <>
        <LandingPage
          onLaunch={handleLaunchWorkspace}
          onSignIn={() => openAuth('login')}
          onSignUp={() => openAuth('register')}
          session={session}
          isBooting={authConfig.loading}
        />
        <AuthDialog
          key={`landing-${authMode}`}
          open={isAuthOpen}
          mode={authMode}
          authRequired={authRequired}
          isSubmitting={isSubmittingAuth}
          error={authError}
          onClose={() => setIsAuthOpen(false)}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
        />
      </>
    )
  }

  if (view === 'desktop') {
    return (
      <>
        <Desktop onLaunchEditor={handleLaunchEditor} />
        <AuthDialog
          key={`desktop-${authMode}`}
          open={isAuthOpen}
          mode={authMode}
          authRequired={authRequired}
          isSubmitting={isSubmittingAuth}
          error={authError}
          onClose={() => setIsAuthOpen(false)}
          onModeChange={setAuthMode}
          onSubmit={handleAuthSubmit}
        />
      </>
    )
  }

  return (
    <>
      <div
        className="h-screen bg-zinc-50 dark:bg-zinc-950 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden"
        style={{ animation: 'dashboard-enter 0.5s ease-out forwards' }}
      >
        <style>{`
          @keyframes dashboard-enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <Topbar
          brand="CodeNest"
          language={language}
          onLanguageChange={(nextLanguage, snippets) => {
            setLanguage(nextLanguage)
            setCode(snippets[nextLanguage])
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
          onToggleLive={() => setShowLivePanel(current => !current)}
          showProjectSidebar={showProjectSidebar}
          onToggleProjects={() => setShowProjectSidebar(current => !current)}
          showVersionPanel={showVersionPanel}
          onToggleVersions={() => setShowVersionPanel(current => !current)}
          isVisualizing={isVisualizing}
          onVisualize={handleVisualize}
          onGoHome={() => setView('desktop')}
          session={session}
          authRequired={authRequired}
          onOpenAuth={() => openAuth('login')}
          onLogout={handleLogout}
        />

        <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 65px)' }}>
          {showProjectSidebar && (
            <ProjectSidebar
              store={projectStore}
              onFileOpen={handleFileOpen}
              onClose={() => setShowProjectSidebar(false)}
            />
          )}

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
                  onClose={() => {
                    setShowDebugPanel(false)
                    setFixResult(null)
                  }}
                  isFixing={isFixing}
                  fixResult={fixResult}
                />
              )}
            </div>

            <PromptPanel prompt={prompt} setPrompt={setPrompt} onApply={applyPrompt} />
          </div>

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

        {showLivePanel && (
          <LiveHintsPanel
            hints={liveHints}
            isLoading={isLiveLoading}
            onClose={() => setShowLivePanel(false)}
          />
        )}
      </div>

      <AuthDialog
        key={`dashboard-${authMode}`}
        open={isAuthOpen}
        mode={authMode}
        authRequired={authRequired}
        isSubmitting={isSubmittingAuth}
        error={authError}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    </>
  )
}

export default App
