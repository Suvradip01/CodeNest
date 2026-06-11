import React from 'react'
import Topbar from '../components/common/Topbar'
import ProjectSidebar from '../features/projects/ProjectSidebar'
import EditorPanel from '../features/editor/EditorPanel'
import ReviewPanel from '../features/ai/ReviewPanel'
import TerminalPanel from '../features/terminal/TerminalPanel'
import DebugPanel from '../components/common/DebugPanel'
import PromptPanel from '../features/ai/PromptPanel'
import VersionTimeline from '../features/versioning/VersionTimeline'
import LiveHintsPanel from '../features/ai/LiveHintsPanel'
import AuthDialog from '../features/auth/components/AuthDialog'

import { useAuth } from '../features/auth/hooks/useAuth'
import { useWorkspace, SNIPPETS } from '../hooks/useWorkspace'
import { explainDiff } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { AUTH_REQUIRED } from '../config/constants'

// Main IDE workspace page that combines all coding, AI, debugging,
// terminal, project management, and versioning panels together.
export default function DashboardView() {

  // React Router navigation for switching pages/screens.
  const navigate = useNavigate()

  // Global authentication/session state from AuthContext.
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

  // Central workspace/business logic controller.
  // Handles editor state, AI actions, terminal output, projects, versions, etc.
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
    handleToggleProjects,
    reviewCode,
    runCode,
    applyPrompt,
    handleAutoFix,
    handleVisualize,
    handleRestore,
  } = useWorkspace()

  return (
    <>
      {/* Root IDE layout container */}
      <div className="animate-dashboard-enter h-screen bg-zinc-50 dark:bg-zinc-950 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden">

        {/* Top navigation toolbar */}
        <Topbar
          brand="CodeNest"

          // Active programming language
          language={language}

          // Reset editor + terminal states when language changes
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

          // AI review trigger
          onReview={reviewCode}

          snippets={SNIPPETS}

          // Toggle AI live hints panel
          showLivePanel={showLivePanel}
          onToggleLive={() => setShowLivePanel(current => !current)}

          // Toggle project sidebar
          showProjectSidebar={showProjectSidebar}
          onToggleProjects={handleToggleProjects}

          // Toggle version history panel
          showVersionPanel={showVersionPanel}
          onToggleVersions={() => setShowVersionPanel(current => !current)}

          // AI diagram generation
          isVisualizing={isVisualizing}
          onVisualize={handleVisualize}

          // Return back to desktop screen
          onGoHome={() => {
            sessionStorage.setItem('codenest_closing', 'true');
            navigate('/desktop');
          }}

          // Current logged-in user session
          session={session}

          authRequired={AUTH_REQUIRED}

          // Open authentication modal
          onOpenAuth={() => openAuth('login')}

          // Logout handler
          onLogout={handleLogout}
        />

        {/* Main workspace body */}
        <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 65px)' }}>

          {/* Left project/file explorer */}
          {showProjectSidebar && (
            <ProjectSidebar
              store={projectStore}
              onFileOpen={handleFileOpen}
              onClose={() => setShowProjectSidebar(false)}
            />
          )}

          {/* Central IDE grid layout */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-4 p-4 lg:p-6 overflow-hidden min-h-0 min-w-0 max-h-full">

            {/* Monaco code editor */}
            <EditorPanel
              code={code}
              setCode={setCode}
              onRun={runCode}
              language={language}
            />

            {/* AI review + Mermaid visualization panel */}
            <ReviewPanel
              review={review}
              mermaidDiagram={mermaidDiagram}
              isVisualizing={isVisualizing}
            />

            {/* Terminal + debugging section */}
            <div className="flex flex-col gap-3 overflow-hidden min-h-0">

              {/* Code execution output terminal */}
              <div className={`transition-all duration-300 flex flex-col overflow-hidden min-h-0 ${showDebugPanel ? 'flex-1' : 'h-full'}`}>
                <TerminalPanel
                  output={output}
                  hasError={hasError}

                  // Open AI debug assistant
                  onDebug={() => setShowDebugPanel(true)}
                />
              </div>

              {/* AI debugging/fix assistant */}
              {showDebugPanel && (
                <DebugPanel
                  debugInfo={
                    hasError
                      ? {
                          errorLines: stderrLines.length ? stderrLines : output,
                          code,
                          language
                        }
                      : null
                  }

                  // AI auto-fix handler
                  onAutoFix={handleAutoFix}

                  // Close debug panel
                  onClose={() => {
                    setShowDebugPanel(false)
                    setFixResult(null)
                  }}

                  isFixing={isFixing}
                  fixResult={fixResult}
                />
              )}
            </div>

            {/* AI prompt/code editing panel */}
            <PromptPanel
              prompt={prompt}
              setPrompt={setPrompt}
              onApply={applyPrompt}
            />
          </div>

          {/* Version history + restore system */}
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

        {/* Live AI linting and complexity analysis */}
        {showLivePanel && (
          <LiveHintsPanel
            hints={liveHints}
            isLoading={isLiveLoading}
            onClose={() => setShowLivePanel(false)}
          />
        )}
      </div>

      {/* Authentication modal available globally inside dashboard */}
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