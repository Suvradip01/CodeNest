import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useProjectStore } from '../store/useProjectStore'
import { useVersionStore } from '../store/useVersionStore'
import {
  editCode,
  getReview,
  liveCheck,
  runCode as runCodeApi,
  visualizeCode,
  debugFix,
} from '../services/api'
import { extractCode, detectErrors, getApiErrorMessage } from '../lib/utils'

export const SNIPPETS = {
  javascript: `// Print "Hello, World!" to the console\nconsole.log("Hello, World!");`,
  python: `# Print "Hello, World!" to the console\nprint("Hello, World!")`,
  java: `/*\n * Print "Hello, World!"\n */\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  c: `/*\n * Print "Hello, World!"\n */\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
}

// Central controller managing active document code status, compilation, debugging, and AI assistants.
export function useWorkspace() {
  // ── Global Zustand stores (singleton — no re-instantiation on mount) ──────
  const session = useAuthStore((s) => s.session)
  const workspaceEnabled = Boolean(session?.token)

  // Project store — read active IDs and actions from the global store
  const projects = useProjectStore((s) => s.projects)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)
  const activeFileId = useProjectStore((s) => s.activeFileId)
  const isLoading = useProjectStore((s) => s.isLoading)
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId)
  const setActiveFileId = useProjectStore((s) => s.setActiveFileId)
  const reloadProjects = useProjectStore((s) => s.reloadProjects)
  const fetchIfNeeded = useProjectStore((s) => s.fetchIfNeeded)
  const resetProjects = useProjectStore((s) => s.reset)
  const createProject = useProjectStore((s) => s.createProject)
  const renameProject = useProjectStore((s) => s.renameProject)
  const deleteProject = useProjectStore((s) => s.deleteProject)
  const createFile = useProjectStore((s) => s.createFile)
  const renameFile = useProjectStore((s) => s.renameFile)
  const deleteFile = useProjectStore((s) => s.deleteFile)
  const updateFileContent = useProjectStore((s) => s.updateFileContent)

  // Derive active project and file from store state
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null
  const activeFile = activeProject?.files.find((f) => f.id === activeFileId) ?? null

  // Version store — global singleton
  const saveSnapshot = useVersionStore((s) => s.saveSnapshot)
  const deleteSnapshot = useVersionStore((s) => s.deleteSnapshot)
  const clearAllSnapshots = useVersionStore((s) => s.clearAll)
  const labelSnapshot = useVersionStore((s) => s.labelSnapshot)
  const versions = useVersionStore((s) => s.versions)

  // ── Local UI state ────────────────────────────────────────────────────────
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

  const liveDebounceRef = useRef(null)
  const saveDebounceRef = useRef(null)
  const lastSavedCode = useRef(code)
  const isSaving = useRef(false)

  // Reset project store whenever the user logs out (workspaceEnabled goes false)
  useEffect(() => {
    if (!workspaceEnabled) {
      resetProjects()
    }
  }, [workspaceEnabled, resetProjects])

  // Live Hints Check Effect: scans active code dynamically 2 seconds after keypress events halt.
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

  // Auto-save Effect: backs up code documents to server databases 2 seconds after typing halts.
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
  }, [activeFileId, activeProjectId, code, updateFileContent])

  // Clears console streams and updates typing scopes when selecting files from the explorer.
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

  // Lazily fetches projects on first sidebar open, then just toggles visibility.
  const handleToggleProjects = useCallback(async () => {
    if (!showProjectSidebar) {
      // Fire-and-forget: fetch data before showing — sidebar renders with spinner if still loading
      fetchIfNeeded().catch(() => {})
    }
    setShowProjectSidebar((current) => !current)
  }, [fetchIfNeeded, showProjectSidebar])

  // Invokes AI principal auditor to evaluate active code blocks and return detailed critiques.
  const reviewCode = useCallback(async () => {
    saveSnapshot(code, language, 'Before review')
    try {
      const data = await getReview(code)
      setReview(data)
    } catch (error) {
      const { status, message } = getApiErrorMessage(error)
      setReview(`## Review unavailable\n\n**Status:** ${status}\n\n${message}`)
    }
  }, [code, language, saveSnapshot])

  // Saves current code state to active timeline registers and starts compilation triggers.
  const runCode = useCallback(async () => {
    saveSnapshot(code, language)

    try {
      const result = await runCodeApi(code, language)
      const lines = result.output || []
      const stderr = result.stderr || []

      setOutput(lines)
      const errDetected = stderr.length > 0 || detectErrors(lines)
      setHasError(errDetected)
      setStderrLines(stderr.length > 0 ? stderr : lines.filter((line) => detectErrors([line])))
      setShowDebugPanel(false)
      setFixResult(null)

      if (result.exitCode !== undefined && result.exitCode !== 0) {
        saveSnapshot(code, language, `Run failed (exit ${result.exitCode})`)
      }
    } catch (error) {
      const { status, message } = getApiErrorMessage(error, 'Execution failed')
      setOutput([`Execution failed (status ${status}): ${message}`])
      setHasError(true)
      setStderrLines([message])
    }
  }, [code, language, saveSnapshot])

  // Interprets natural-language prompt instructions to update active editor code models.
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

  // Triggers asynchronous code correction, replacing erroneous source with patched AI overlays.
  const handleAutoFix = useCallback(async () => {
    if (!stderrLines.length && !hasError) return

    setIsFixing(true)
    try {
      const errorOutput = stderrLines.join('\n') || output.join('\n')
      const result = await debugFix(code, errorOutput, language)
      setFixResult(result)

      if (result.fixedCode) {
        saveSnapshot(code, language, 'Before AI fix')
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
  }, [code, hasError, language, output, stderrLines, saveSnapshot])

  // Queries AI engine to compile dynamic Mermaid flowchart diagrams based on code statement trees.
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

  // Resets active code text to a previous local memory snapshot from the history list.
  const handleRestore = useCallback((snapshotCode, snapshotLanguage) => {
    saveSnapshot(code, language, 'Before restore')
    setCode(snapshotCode)
    setLanguage(snapshotLanguage)
    setOutput([])
    setHasError(false)
    setShowVersionPanel(false)
  }, [code, language, saveSnapshot])

  // Compose a versionStore-compatible object for backwards compat with child components
  const versionStore = { versions, saveSnapshot, deleteSnapshot, clearAll: clearAllSnapshots, labelSnapshot }

  // Compose a projectStore-compatible object for backwards compat with child components
  const projectStore = {
    projects,
    activeProject,
    activeFile,
    activeProjectId,
    activeFileId,
    isLoading,
    setActiveProjectId,
    setActiveFileId,
    reloadProjects,
    fetchIfNeeded,
    reset: resetProjects,
    createProject,
    renameProject,
    deleteProject,
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
  }

  return {
    language,
    setLanguage,
    code,
    setCode,
    review,
    setReview,
    output,
    setOutput,
    prompt,
    setPrompt,
    showLivePanel,
    setShowLivePanel,
    liveHints,
    setLiveHints,
    isLiveLoading,
    setIsLiveLoading,
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
    setIsFixing,
    fixResult,
    setFixResult,
    mermaidDiagram,
    setMermaidDiagram,
    isVisualizing,
    setIsVisualizing,
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
  }
}
