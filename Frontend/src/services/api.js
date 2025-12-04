import axios from 'axios'

export async function getReview(code) {
  const response = await axios.post('http://localhost:3000/ai/get-review', { code })
  return response.data
}

export async function runCode(code, language) {
  const res = await axios.post('http://localhost:3000/code/run', { code, language })
  return res.data
}

export async function editCode(prompt, code) {
  const res = await axios.post('http://localhost:3000/ai/edit-code', { prompt, code })
  return res.data
}

