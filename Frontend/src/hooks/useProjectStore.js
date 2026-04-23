// useProjectStore — CRUD for projects/files persisted on the backend disk
// Schema: { projects: [{ id, name, createdAt, files: [{ id, name, language, content }] }] }

import { useState, useCallback, useEffect } from 'react'
import {
  listProjects,
  createProjectApi,
  saveFileApi,
  deleteFileApi,
  deleteProjectApi
} from '../services/api'

export function useProjectStore() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeFileId, setActiveFileId] = useState(null)

  // Load projects from backend on mount
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await listProjects()
        setProjects(data)
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // ── Projects ──────────────────────────────────────────────────────────────
  const createProject = useCallback(async (name) => {
    try {
      const newProject = await createProjectApi(name)
      setProjects(prev => [...prev, newProject])
      setActiveProjectId(newProject.id)
      setActiveFileId(null)
      return newProject
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }, [])

  const deleteProject = useCallback(async (projectId) => {
    try {
      await deleteProjectApi(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      if (activeProjectId === projectId) {
        setActiveProjectId(null)
        setActiveFileId(null)
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }, [activeProjectId])

  // ── Files ─────────────────────────────────────────────────────────────────
  const createFile = useCallback(async (projectId, name, language = 'javascript', content = '') => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      // Append extension if missing
      let fileName = name
      if (!fileName.includes('.')) {
        if (language === 'python') fileName += '.py'
        else if (language === 'java') fileName += '.java'
        else if (language === 'c') fileName += '.c'
        else fileName += '.js'
      }

      const newFile = await saveFileApi(projectId, fileName, content)
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
      ))
      setActiveFileId(newFile.id)
      return newFile
    } catch (err) {
      console.error('Failed to create file:', err)
    }
  }, [projects])

  const deleteFile = useCallback(async (projectId, fileId) => {
    try {
      await deleteFileApi(projectId, fileId)
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
      ))
      if (activeFileId === fileId) {
        setActiveFileId(null)
      }
    } catch (err) {
      console.error('Failed to delete file:', err)
    }
  }, [activeFileId])

  const updateFileContent = useCallback(async (projectId, fileId, content) => {
    try {
      // Opt-out: we only save to disk, we don't need a response for the UI update usually
      // to keep it fast, but we should update local state
      setProjects(prev => prev.map(p =>
        p.id === projectId
          ? { ...p, files: p.files.map(f => f.id === fileId ? { ...f, content } : f) }
          : p
      ))
      await saveFileApi(projectId, fileId, content)
    } catch (err) {
      console.error('Failed to update file content:', err)
    }
  }, [])

  // ── Selectors ─────────────────────────────────────────────────────────────
  const activeProject = projects.find(p => p.id === activeProjectId) || null
  const activeFile = activeProject?.files.find(f => f.id === activeFileId) || null

  return {
    projects,
    activeProject,
    activeFile,
    activeProjectId,
    activeFileId,
    isLoading,
    setActiveProjectId,
    setActiveFileId,
    createProject,
    deleteProject,
    createFile,
    deleteFile,
    updateFileContent,
  }
}

