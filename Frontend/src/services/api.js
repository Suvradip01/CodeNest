import axios from 'axios'

function stripTrailingSlashes(value) {
  return String(value || '').replace(/\/+$/, '')
}

function ensureApiPath(value) {
  return /\/api$/i.test(value) ? value : `${value}/api`
}

// Resolves backend API URL based on env configs, ensuring endpoints have the standard /api suffix.
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

// Main Axios instance configured with a baseline 20-second timeout limit.
export const apiClient = axios.create({
  baseURL: BASE,
  timeout: 20000,
})

// Checks if the browser's localStorage API is fully active and accessible.
function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

// Binds or deletes the active JWT session token in global Axios request headers.
export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common.Authorization
  }
}

// Recovers and parses the active user session from browser cache storage.
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

// Saves user token and profile details to localStorage for session persistence.
export function persistSession(session) {
  if (!session?.token) return
  setAuthToken(session.token)
  if (canUseStorage()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

// Clears cached credentials and deletes authorization tokens from Axios headers.
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

if (import.meta.env.DEV) {
  console.log('[CodeNest] Connecting to Backend at:', BASE)
}

// Queries backend metrics to verify server connectivity and database health.
export async function fetchHealth() {
  const res = await apiClient.get('/health')
  return res.data
}

// Sends registration form payload to sign up a new user.
export async function registerUserApi(payload) {
  const res = await apiClient.post('/auth/register', payload)
  return res.data
}

// Submits email/password payload to log in an existing user.
export async function loginUserApi(payload) {
  const res = await apiClient.post('/auth/login', payload)
  return res.data
}

// Requests a secure password recovery token link sent via transaction email.
export async function resetPasswordApi(payload) {
  const res = await apiClient.post('/auth/reset-password', payload)
  return res.data
}

// Posts a new password tied directly to the cryptographically validated reset token.
export async function updatePasswordApi(payload) {
  const res = await apiClient.post('/auth/update-password', payload)
  return res.data
}

// Hydrates the current logged-in user profile from active session claims.
export async function getCurrentUserApi() {
  const res = await apiClient.get('/auth/me')
  return res.data.user
}

// Triggers AI principal auditor to evaluate active code and return markdown reviews.
export async function getReview(code) {
  const res = await apiClient.post('/ai/get-review', { code })
  return res.data
}

// Sends code to isolated Docker runner nodes for sandboxed compilation.
export async function runCode(code, language) {
  const res = await apiClient.post('/code/run', { code, language })
  return res.data
}

// Submits natural language editing commands to LLM to receive refactored code overlays.
export async function editCode(prompt, code) {
  const res = await apiClient.post('/ai/edit-code', { prompt, code })
  return res.data
}

// Scans active code dynamically to provide lint hints and complexity scopes.
export async function liveCheck(code, language) {
  const res = await apiClient.post('/ai/live-check', { code, language })
  return res.data
}

// Queries AI assistant to explain differences between two program version versions.
export async function explainDiff(oldCode, newCode) {
  const res = await apiClient.post('/ai/explain-diff', { oldCode, newCode })
  return res.data.explanation
}

// Sends error logs and stack traces to AI models for automated code fixing.
export async function debugFix(code, errorOutput, language) {
  const res = await apiClient.post('/ai/debug-fix', { code, errorOutput, language })
  return res.data
}

// Invokes AI to generate dynamic Mermaid architecture flowcharts from active code.
export async function visualizeCode(code, language) {
  const res = await apiClient.post('/ai/visualize', { code, language })
  return res.data.diagram
}

// Retrieves all workspaces/projects bound to the authenticated user.
export async function listProjects() {
  const res = await apiClient.get('/projects')
  return res.data.projects
}

// Creates an empty workspace project folder.
export async function createProjectApi(name) {
  const res = await apiClient.post('/projects', { name })
  return res.data
}

// Renames an existing workspace project folder.
export async function renameProjectApi(projectId, name) {
  const res = await apiClient.patch(`/projects/${projectId}`, { name })
  return res.data
}

// Optimistically saves new file instances or content updates to project directories.
export async function saveFileApi(projectId, name, content) {
  const res = await apiClient.post(`/projects/${projectId}/files`, { name, content })
  return res.data
}

// Renames a specific file node in the project explorer.
export async function renameFileApi(projectId, fileId, name) {
  const res = await apiClient.patch(`/projects/${projectId}/files/${fileId}`, { name })
  return res.data
}

// Deletes a specific file node from the project explorer.
export async function deleteFileApi(projectId, fileId) {
  const res = await apiClient.delete(`/projects/${projectId}/files/${fileId}`)
  return res.data
}

// Permanently deletes an entire workspace project folder.
export async function deleteProjectApi(projectId) {
  const res = await apiClient.delete(`/projects/${projectId}`)
  return res.data
}

// Downloads project workspaces as a zipped package generated asynchronously.
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
