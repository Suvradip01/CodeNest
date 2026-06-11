import { useState, useCallback, useEffect, useRef } from 'react'
import {
  listProjects,
  createProjectApi,
  renameProjectApi,
  saveFileApi,
  renameFileApi,
  deleteFileApi,
  deleteProjectApi,
} from '../../services/api'

// Custom store that syncs candidate project folders and files to database endpoints in real-time.
export function useProjectStore({ enabled = true } = {}) {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeFileId, setActiveFileId] = useState(null)

  // Track whether we have done at least one successful fetch
  const hasFetchedRef = useRef(false)
  // Stable ref for activeProjectId to avoid useCallback dependency churn
  const activeProjectIdRef = useRef(activeProjectId)
  useEffect(() => { activeProjectIdRef.current = activeProjectId }, [activeProjectId])

  // Clears all active directory registers and file states from memory upon signing out.
  const reset = useCallback(() => {
    setProjects([])
    setActiveProjectId(null)
    setActiveFileId(null)
    setIsLoading(false)
    hasFetchedRef.current = false
  }, [])

  // Syncs projects list from the server databases and filters out stale indices.
  const reloadProjects = useCallback(async () => {
    if (!enabled) {
      reset()
      return []
    }

    setIsLoading(true)
    try {
      const data = await listProjects()
      setProjects(data)
      hasFetchedRef.current = true

      const currentActiveId = activeProjectIdRef.current
      if (currentActiveId && !data.some(project => project.id === currentActiveId)) {
        setActiveProjectId(null)
        setActiveFileId(null)
      }

      return data
    } catch (err) {
      console.error('Failed to load projects:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [enabled, reset])

  // Fetch projects only on first open (lazy) — avoids hitting the server on page load.
  const fetchIfNeeded = useCallback(async () => {
    if (hasFetchedRef.current || !enabled) return
    return reloadProjects()
  }, [enabled, reloadProjects])

  // Reset store when auth is disabled (user logged out)
  useEffect(() => {
    if (!enabled) {
      reset()
    }
  }, [enabled, reset])

  // Submits a new workspace folder request to create a project in the database.
  const createProject = useCallback(async (name) => {
    const newProject = await createProjectApi(name)
    setProjects(prev => [...prev, newProject])
    setActiveProjectId(newProject.id)
    setActiveFileId(null)
    return newProject
  }, [])

  // Modifies a selected project name and updates active state metadata.
  const renameProject = useCallback(async (projectId, nextName) => {
    const renamed = await renameProjectApi(projectId, nextName)
    setProjects(prev => prev.map(project => (
      project.id === projectId ? { ...project, name: renamed.name, updatedAt: renamed.updatedAt } : project
    )))
    return renamed
  }, [])

  // Permanently deletes a project folder from the candidate database.
  const deleteProject = useCallback(async (projectId) => {
    await deleteProjectApi(projectId)
    setProjects(prev => prev.filter(project => project.id !== projectId))
    if (activeProjectId === projectId) {
      setActiveProjectId(null)
      setActiveFileId(null)
    }
  }, [activeProjectId])

  // Creates a new file document, automatically appending correct program extensions.
  const createFile = useCallback(async (projectId, name, language = 'javascript', content = '') => {
    let fileName = name
    if (!fileName.includes('.')) {
      if (language === 'python') fileName += '.py'
      else if (language === 'java') fileName += '.java'
      else if (language === 'c') fileName += '.c'
      else fileName += '.js'
    }

    const newFile = await saveFileApi(projectId, fileName, content)
    setProjects(prev => prev.map(project => (
      project.id === projectId ? { ...project, files: [...project.files, newFile] } : project
    )))
    setActiveProjectId(projectId)
    setActiveFileId(newFile.id)
    return newFile
  }, [])

  // Modifies file names and re-evaluates the programming language types based on suffixes.
  const renameFile = useCallback(async (projectId, fileId, nextName) => {
    const renamed = await renameFileApi(projectId, fileId, nextName)
    setProjects(prev => prev.map(project => (
      project.id === projectId
        ? {
            ...project,
            files: project.files.map(file => (
              file.id === fileId
                ? { ...file, name: renamed.name, language: renamed.language, updatedAt: renamed.updatedAt }
                : file
            )),
          }
        : project
    )))
    return renamed
  }, [])

  // Deletes a selected file document, clearing active selection keys cleanly.
  const deleteFile = useCallback(async (projectId, fileId) => {
    await deleteFileApi(projectId, fileId)
    setProjects(prev => prev.map(project => (
      project.id === projectId
        ? { ...project, files: project.files.filter(file => file.id !== fileId) }
        : project
    )))
    if (activeFileId === fileId) {
      setActiveFileId(null)
    }
  }, [activeFileId])

  // Optimistically writes active buffer edits locally before pushing save updates.
  const updateFileContent = useCallback(async (projectId, fileId, content) => {
    setProjects(prev => prev.map(project => (
      project.id === projectId
        ? {
            ...project,
            files: project.files.map(file => (
              file.id === fileId ? { ...file, content } : file
            )),
          }
        : project
    )))

    await saveFileApi(projectId, fileId, content)
  }, [])

  const activeProject = projects.find(project => project.id === activeProjectId) || null
  const activeFile = activeProject?.files.find(file => file.id === activeFileId) || null

  return {
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
    reset,
    createProject,
    renameProject,
    deleteProject,
    createFile,
    renameFile,
    deleteFile,
    updateFileContent,
  }
}
