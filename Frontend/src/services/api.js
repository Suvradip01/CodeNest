import axios from 'axios'

// API service layer: encapsulates HTTP calls to the backend
// Base URL assumes local server; swap as needed for deployment

// Request an AI review for the given code; returns markdown
export async function getReview(code) {
  const response = await axios.post('http://localhost:3000/ai/get-review', { code })
  return response.data
}

// Execute code for the selected language; returns { output: string[] }
export async function runCode(code, language) {
  const res = await axios.post('http://localhost:3000/code/run', { code, language })
  return res.data
}

// Apply a natural-language prompt to transform code; may return fenced code
export async function editCode(prompt, code) {
  const res = await axios.post('http://localhost:3000/ai/edit-code', { prompt, code })
  return res.data
}
