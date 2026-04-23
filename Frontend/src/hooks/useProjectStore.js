import { useState, useCallback, useEffect } from 'react'
import {
  listProjects,
  createProjectApi,
  renameProjectApi,
  saveFileApi,
  renameFileApi,
  deleteFileApi,
  deleteProjectApi,
} from '../services/api'

export function useProjectStore({ enabled = true } = {}) {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(Boolean(enabled))
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [activeFileId, setActiveFileId] = useState(null)

  const reset = useCallback(() => {
    setProjects([])
    setActiveProjectId(null)
    setActiveFileId(null)
    setIsLoading(false)
  }, [])

  const reloadProjects = useCallback(async () => {
    if (!enabled) {
      reset()
      return []
    }

    setIsLoading(true)
    try {
      const data = await listProjects()
      setProjects(data)

      if (activeProjectId && !data.some(project => project.id === activeProjectId)) {
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
  }, [activeProjectId, enabled, reset])

  useEffect(() => {
    if (!enabled) {
      reset()
      return
    }

    reloadProjects().catch(() => {})
  }, [enabled, reloadProjects, reset])

  const createProject = useCallback(async (name) => {
    const newProject = await createProjectApi(name)
    setProjects(prev => [...prev, newProject])
    setActiveProjectId(newProject.id)
    setActiveFileId(null)
    return newProject
  }, [])

  const renameProject = useCallback(async (projectId, nextName) => {
    const renamed = await renameProjectApi(projectId, nextName)
    setProjects(prev => prev.map(project => (
      project.id === projectId ? { ...project, name: renamed.name, updatedAt: renamed.updatedAt } : project
    )))
    return renamed
  }, [])

  const deleteProject = useCallback(async (projectId) => {
    await deleteProjectApi(projectId)
    setProjects(prev => prev.filter(project => project.id !== projectId))
    if (activeProjectId === projectId) {
      setActiveProjectId(null)
      setActiveFileId(null)
    }
  }, [activeProjectId])

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
