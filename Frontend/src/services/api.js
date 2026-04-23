import axios from 'axios'

function stripTrailingSlashes(value) {
  return String(value || '').replace(/\/+$/, '')
}

function ensureApiPath(value) {
  return /\/api$/i.test(value) ? value : `${value}/api`
}

function resolveApiBaseUrl() {
  let rawBase = String(import.meta.env.VITE_API_URL || '').trim()

  if (!rawBase || rawBase === '/') {
    return '/api'
  }

  if (rawBase.startsWith('/')) {
    return ensureApiPath(stripTrailingSlashes(rawBase))
  }

  if (!/^https?:\/\//i.test(rawBase)) {
    rawBase = `https://${rawBase}`
  }

  return ensureApiPath(stripTrailingSlashes(rawBase))
}

const BASE = resolveApiBaseUrl()
const SESSION_KEY = 'codenest-session'

export const apiClient = axios.create({
  baseURL: BASE,
  timeout: 20000,
})

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

export function getStoredSession() {
  if (!canUseStorage()) return null

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.error('Failed to parse stored session:', error)
    return null
  }
}

export function persistSession(session) {
  if (!session?.token) return
  setAuthToken(session.token)
  if (canUseStorage()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function clearStoredSession() {
  setAuthToken(null)
  if (canUseStorage()) {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

const bootSession = getStoredSession()
if (bootSession?.token) {
  setAuthToken(bootSession.token)
}

console.log('[CodeNest] Connecting to Backend at:', BASE)

export async function fetchHealth() {
  const res = await apiClient.get('/health')
  return res.data
}

export async function registerUserApi(payload) {
  const res = await apiClient.post('/auth/register', payload)
  return res.data
}

export async function loginUserApi(payload) {
  const res = await apiClient.post('/auth/login', payload)
  return res.data
}

export async function getCurrentUserApi() {
  const res = await apiClient.get('/auth/me')
  return res.data.user
}

export async function getReview(code) {
  const res = await apiClient.post('/ai/get-review', { code })
  return res.data
}

export async function runCode(code, language) {
  const res = await apiClient.post('/code/run', { code, language })
  return res.data
}

export async function editCode(prompt, code) {
  const res = await apiClient.post('/ai/edit-code', { prompt, code })
  return res.data
}

export async function liveCheck(code, language) {
  const res = await apiClient.post('/ai/live-check', { code, language })
  return res.data
}

export async function explainDiff(oldCode, newCode) {
  const res = await apiClient.post('/ai/explain-diff', { oldCode, newCode })
  return res.data.explanation
}

export async function debugFix(code, errorOutput, language) {
  const res = await apiClient.post('/ai/debug-fix', { code, errorOutput, language })
  return res.data
}

export async function visualizeCode(code, language) {
  const res = await apiClient.post('/ai/visualize', { code, language })
  return res.data.diagram
}

export async function listProjects() {
  const res = await apiClient.get('/projects')
  return res.data.projects
}

export async function createProjectApi(name) {
  const res = await apiClient.post('/projects', { name })
  return res.data
}

export async function renameProjectApi(projectId, name) {
  const res = await apiClient.patch(`/projects/${projectId}`, { name })
  return res.data
}

export async function saveFileApi(projectId, name, content) {
  const res = await apiClient.post(`/projects/${projectId}/files`, { name, content })
  return res.data
}

export async function renameFileApi(projectId, fileId, name) {
  const res = await apiClient.patch(`/projects/${projectId}/files/${fileId}`, { name })
  return res.data
}

export async function deleteFileApi(projectId, fileId) {
  const res = await apiClient.delete(`/projects/${projectId}/files/${fileId}`)
  return res.data
}

export async function deleteProjectApi(projectId) {
  const res = await apiClient.delete(`/projects/${projectId}`)
  return res.data
}

export async function downloadProjectApi(projectId, projectName) {
  const res = await apiClient.get(`/projects/${projectId}/download`, {
    responseType: 'blob',
  })

  if (typeof window === 'undefined') return

  const blob = new Blob([res.data], { type: 'application/zip' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${projectName}.zip`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}
