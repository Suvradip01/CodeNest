/**
 * useProjectStore — Global Zustand project store.
 *
 * Replaces the custom `useProjectStore` React hook with a singleton store
 * so project state is shared across all components without prop-drilling.
 * Enabled/disabled state is driven by calling `reset()` when the auth
 * session is cleared.
 */
import { create } from 'zustand'
import {
  listProjects,
  createProjectApi,
  renameProjectApi,
  saveFileApi,
  renameFileApi,
  deleteFileApi,
  deleteProjectApi,
} from '../services/api'

export const useProjectStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  projects: [],
  isLoading: false,
  activeProjectId: null,
  activeFileId: null,
  /** True after at least one successful fetch (guards lazy-load). */
  hasFetched: false,

  // ── Computed helpers (call as functions, not state) ────────────────────────
  /** Returns the active project object or null. */
  get activeProject() {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) ?? null
  },
  /** Returns the active file object or null. */
  get activeFile() {
    const project = get().activeProject
    const { activeFileId } = get()
    return project?.files.find((f) => f.id === activeFileId) ?? null
  },

  // ── Setters ────────────────────────────────────────────────────────────────
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
  setActiveFileId: (activeFileId) => set({ activeFileId }),

  // ── Reset (called on logout) ───────────────────────────────────────────────
  /** Clears all project state when the user logs out. */
  reset: () =>
    set({
      projects: [],
      activeProjectId: null,
      activeFileId: null,
      isLoading: false,
      hasFetched: false,
    }),

  // ── Fetching ───────────────────────────────────────────────────────────────
  /** Full reload from server — always hits the network. */
  reloadProjects: async () => {
    set({ isLoading: true })
    try {
      const data = await listProjects()
      const { activeProjectId } = get()
      const updates = { projects: data, hasFetched: true }

      // Clear stale active selection if project was deleted server-side
      if (activeProjectId && !data.some((p) => p.id === activeProjectId)) {
        updates.activeProjectId = null
        updates.activeFileId = null
      }

      set(updates)
      return data
    } catch (err) {
      console.error('Failed to load projects:', err)
      throw err
    } finally {
      set({ isLoading: false })
    }
  },

  /** Lazy fetch: only hits network on first call. */
  fetchIfNeeded: async () => {
    if (get().hasFetched) return
    return get().reloadProjects()
  },

  // ── Project CRUD ───────────────────────────────────────────────────────────
  createProject: async (name) => {
    const newProject = await createProjectApi(name)
    set((s) => ({
      projects: [...s.projects, newProject],
      activeProjectId: newProject.id,
      activeFileId: null,
    }))
    return newProject
  },

  renameProject: async (projectId, nextName) => {
    const renamed = await renameProjectApi(projectId, nextName)
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, name: renamed.name, updatedAt: renamed.updatedAt }
          : p
      ),
    }))
    return renamed
  },

  deleteProject: async (projectId) => {
    await deleteProjectApi(projectId)
    set((s) => {
      const updates = { projects: s.projects.filter((p) => p.id !== projectId) }
      if (s.activeProjectId === projectId) {
        updates.activeProjectId = null
        updates.activeFileId = null
      }
      return updates
    })
  },

  // ── File CRUD ──────────────────────────────────────────────────────────────
  createFile: async (projectId, name, language = 'javascript', content = '') => {
    let fileName = name
    if (!fileName.includes('.')) {
      if (language === 'python') fileName += '.py'
      else if (language === 'java') fileName += '.java'
      else if (language === 'c') fileName += '.c'
      else fileName += '.js'
    }

    const newFile = await saveFileApi(projectId, fileName, content)
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
      ),
      activeProjectId: projectId,
      activeFileId: newFile.id,
    }))
    return newFile
  },

  renameFile: async (projectId, fileId, nextName) => {
    const renamed = await renameFileApi(projectId, fileId, nextName)
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId
                  ? { ...f, name: renamed.name, language: renamed.language, updatedAt: renamed.updatedAt }
                  : f
              ),
            }
          : p
      ),
    }))
    return renamed
  },

  deleteFile: async (projectId, fileId) => {
    await deleteFileApi(projectId, fileId)
    set((s) => {
      const updates = {
        projects: s.projects.map((p) =>
          p.id === projectId
            ? { ...p, files: p.files.filter((f) => f.id !== fileId) }
            : p
        ),
      }
      if (s.activeFileId === fileId) updates.activeFileId = null
      return updates
    })
  },

  /** Optimistically updates local content, then persists to server. */
  updateFileContent: async (projectId, fileId, content) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: p.files.map((f) =>
                f.id === fileId ? { ...f, content } : f
              ),
            }
          : p
      ),
    }))
    await saveFileApi(projectId, fileId, content)
  },
}))
