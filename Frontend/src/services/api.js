import axios from 'axios'

// API service layer: encapsulates HTTP calls to the backend
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// ── Existing endpoints ─────────────────────────────────────────────────────

// Request an AI review for the given code; returns markdown
export async function getReview(code) {
  const res = await axios.post(`${BASE}/ai/get-review`, { code })
  return res.data
}

// Execute code for the selected language; returns { output, stderr, exitCode }
export async function runCode(code, language) {
  const res = await axios.post(`${BASE}/code/run`, { code, language })
  return res.data
}

// Apply a natural-language prompt to transform code; may return fenced code
export async function editCode(prompt, code) {
  const res = await axios.post(`${BASE}/ai/edit-code`, { prompt, code })
  return res.data
}

// ── Feature 1: Live AI Layer ───────────────────────────────────────────────
// Returns { warnings, suggestions, complexity }
export async function liveCheck(code, language) {
  const res = await axios.post(`${BASE}/ai/live-check`, { code, language })
  return res.data
}

// ── Feature 3: Versioning — Explain Diff ──────────────────────────────────
// Returns { explanation: string }
export async function explainDiff(oldCode, newCode) {
  const res = await axios.post(`${BASE}/ai/explain-diff`, { oldCode, newCode })
  return res.data.explanation
}

// ── Feature 4: AI Debug Mode ──────────────────────────────────────────────
// Returns { errorType, explanation, fixedCode }
export async function debugFix(code, errorOutput, language) {
  const res = await axios.post(`${BASE}/ai/debug-fix`, { code, errorOutput, language })
  return res.data
}

// ── Feature 5: Visual Execution ───────────────────────────────────────────
// Returns mermaid diagram string
export async function visualizeCode(code, language) {
  const res = await axios.post(`${BASE}/ai/visualize`, { code, language })
  return res.data.diagram
}
// ── Feature 2: Project Management Endpoints (Disk-based) ──────────────────
export async function listProjects() {
  const res = await axios.get(`${BASE}/projects`)
  return res.data.projects
}

export async function createProjectApi(name) {
  const res = await axios.post(`${BASE}/projects`, { name })
  return res.data
}

export async function saveFileApi(projectName, name, content) {
  const res = await axios.post(`${BASE}/projects/${projectName}/files`, { name, content })
  return res.data
}

export async function deleteFileApi(projectName, fileName) {
  const res = await axios.delete(`${BASE}/projects/${projectName}/files/${fileName}`)
  return res.data
}

export async function deleteProjectApi(projectName) {
  const res = await axios.delete(`${BASE}/projects/${projectName}`)
  return res.data
}

export function getDownloadUrl(projectName) {
  return `${BASE}/projects/${projectName}/download`
}
