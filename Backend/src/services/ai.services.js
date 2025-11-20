const { GoogleGenAI } = require("@google/genai");

// Initialize client
const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_KEY
});

const MODEL_ID = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
You are a senior code reviewer. Return a concise, well‑structured Markdown report with these sections:

## Summary
- Brief overview of what the code does
- High‑level quality assessment

## Issues
- List specific problems (bugs, edge cases, anti‑patterns)

## Improvements
- Actionable refactors and best practices
- Performance considerations

## Security
- Potential vulnerabilities and mitigations

## Tests
- Suggested unit/integration cases

## Example Fix
\`\`\`language
// Provide a small corrected snippet demonstrating key improvements
\`\`\`
`;

// Reusable function
async function generateContent(prompt) {
    const response = await ai.models.generateContent({
        model: MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
        contents: prompt
    });

    return response.text;
}

module.exports = generateContent;
module.exports.editCode = async function(prompt, code) {
    const response = await ai.models.generateContent({
        model: MODEL_ID,
        systemInstruction: "You are an expert code editor. Update the provided code according to the prompt. Return ONLY the complete updated source code without explanations. Prefer no Markdown fences.",
        contents: `${prompt}\n\n${code}`
    });
    return response.text;
}
