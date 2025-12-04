// AI service layer: wraps calls to Google Gemini models for review and code edits
const { GoogleGenAI } = require("@google/genai")

// Initialize client using API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY })

// Model to use
const MODEL_ID = "gemini-2.5-flash"

// Instruction describing the desired structure of the review
const SYSTEM_INSTRUCTION = `
You are a helpful code reviewer. Return a simple Markdown document using EXACTLY these sections and no others. Use clear, beginner‑friendly language.

## How It Works
- Explain the overall purpose in 1–2 sentences
- Describe the control flow step‑by‑step (what runs first, then next)
- Mention key functions/blocks and what they do
- Note inputs, outputs, and any side‑effects

## Improvements
- Provide at least 3 specific, actionable bullet points
- If code is simple, suggest naming/structure, comments/docs, error handling, tests, and small performance tweaks
- Include a brief reason for each suggestion

Do NOT add extra sections (no Summary, Security, Tests, or Example Fix). Use EXACTLY the two headings above.
`

// Generate a markdown review for given input prompt (usually the source code)
async function generateContent(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    systemInstruction: SYSTEM_INSTRUCTION,
    contents: prompt
  })
  return response.text
}

module.exports = generateContent

// Edit code based on a natural-language prompt; returns updated source text
module.exports.editCode = async function (prompt, code) {
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    systemInstruction:
      "You are an expert code editor. Update the provided code according to the prompt. Return ONLY the complete updated source code without explanations. Prefer no Markdown fences.",
    contents: `${prompt}\n\n${code}`
  })
  return response.text
}
