import Topbar from '../components/common/Topbar'
import ProjectSidebar from '../features/projects/ProjectSidebar'
import EditorPanel from '../features/editor/EditorPanel'
import ReviewPanel from '../features/ai/ReviewPanel'
import TerminalPanel from '../features/terminal/TerminalPanel'
import DebugPanel from '../components/common/DebugPanel'
import PromptPanel from '../features/ai/PromptPanel'
import VersionTimeline from '../features/versioning/VersionTimeline'
import LiveHintsPanel from '../features/ai/liveHints/LiveHintsPanel'
import AuthDialog from '../features/auth/components/AuthDialog'

import { useAuth } from '../features/auth/hooks/useAuth'
import { useWorkspace, SNIPPETS } from '../hooks/useWorkspace'
import { explainDiff } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AUTH_REQUIRED } from '../config/constants'

// Principal dashboard container rendering the unified full-stack IDE workspace panels.
export default function DashboardView() {
  const navigate = useNavigate()
  const {
    session,
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    authError,
    isSubmittingAuth,
    openAuth,
    handleAuthSubmit,
    handleLogout,
  } = useAuth()

  const {
    language,
    setLanguage,
    code,
    setCode,
    review,
    output,
    setOutput,
    prompt,
    setPrompt,
    showLivePanel,
    setShowLivePanel,
    liveHints,
    isLiveLoading,
    showProjectSidebar,
    setShowProjectSidebar,
    showVersionPanel,
    setShowVersionPanel,
    hasError,
    setHasError,
    stderrLines,
    setStderrLines,
    showDebugPanel,
    setShowDebugPanel,
    isFixing,
    fixResult,
    setFixResult,
    mermaidDiagram,
    setMermaidDiagram,
    isVisualizing,
    projectStore,
    versionStore,
    handleFileOpen,
    reviewCode,
    runCode,
    applyPrompt,
    handleAutoFix,
    handleVisualize,
    handleRestore,
  } = useWorkspace()


  return (
    <>
      <div className="animate-dashboard-enter h-screen bg-zinc-50 dark:bg-zinc-950 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden">

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
          onGoHome={() => {
            sessionStorage.setItem('codenest_closing', 'true');
            navigate('/desktop');
          }}
          session={session}
          authRequired={AUTH_REQUIRED}
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
        authRequired={AUTH_REQUIRED}
        isSubmitting={isSubmittingAuth}
        error={authError}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    </>
  )
}
