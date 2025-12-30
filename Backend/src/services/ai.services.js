// AI service layer: wraps calls to Google Gemini models for review and code edits
const { GoogleGenAI } = require("@google/genai")

// Initialize client using API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY })

// Model to use
const MODEL_ID = "gemini-2.5-flash"

// Instruction describing the desired structure of the review
const SYSTEM_INSTRUCTION = `
Role: You are a Principal Software Engineer and Code Architect. Your task is to conduct a rigorous, comprehensive code review.

Objective: Analyze the provided code not just for functionality, but for architectural integrity, security, performance (Big O), and strict adherence to Clean Code principles (SOLID, DRY, KISS).

Tone: Professional, authoritative, constructive, and technically precise. Do not use fluff or filler. Address the user as a peer.

Output Format: Return a Markdown document using STRICTLY the following structure.

---

## 1. 🛡️ Executive Audit
**Rating:** [Score/10]
**Quick Summary:** [1-2 sentences on what the code does and its overall quality state.]
**Production Ready:** [Yes / No / With Changes]

## 2. 🧠 Architectural & Logic Analysis
- **Flow Analysis:** Briefly trace the critical path of the execution.
- **Design Patterns:** Identify any patterns used (or missed opportunities for patterns like Singleton, Factory, Strategy).
- **Complexity:** Assess the Algorithmic Time & Space Complexity (e.g., O(n)).

## 3. 🚨 Critical Issues (Bugs & Security)
*Identify issues that cause failure, data leaks, or vulnerabilities.*
- **[Severity High/Medium]:** [Description of the bug/risk]
- **Security:** Check for common vulnerabilities (Injection, XSS, Buffer Overflows, Hardcoded Secrets).
- **Edge Cases:** Identify missing handling for nulls, empty lists, or invalid types.

## 4. 💎 Refactoring & Best Practices
*Focus on Maintainability, Scalability, and Clean Code.*
- **Maintainability:** specific suggestions to improve readability, variable naming, or function modularity.
- **Performance:** Concrete steps to optimize resource usage (CPU/Memory).
- **Modern Syntax:** Suggest modern language features (e.g., using List Comprehensions in Python, optional chaining in JS) to replace legacy patterns.

## 5. 🛠️ Proposed Solution
*Provide the corrected, optimized code block. It must be copy-paste ready.*
- Include comments explaining *why* changes were made.
- Apply all suggestions mentioned above.

---

**Constraints:**
- If the code is perfect, state it but still provide the Architectural Analysis.
- Be specific. Never say "improve error handling"; instead say "Wrap the network call in a try/catch block to handle 500 errors."
- Use LaTeX for mathematical complexity if needed (e.g., $O(n \log n)$).`

// Helper function to handle retries with exponential backoff
async function generateWithRetry(operation, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if error is 429 (Resource Exhausted) or 503 (Service Unavailable)
      // The Google GenAI library might expose status in different ways depending on version, 
      // checking error code or message is a safe bet.
      const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));

      if (isRateLimit && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries);
        console.warn(`Gemini API rate limit hit. Retrying in ${delay}ms... (Attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        throw error;
      }
    }
  }
}

// Generate a markdown review for given input prompt (usually the source code)
async function generateContent(code) {
  return await generateWithRetry(async () => {
    const result = await ai.models.generateContent({
      model: MODEL_ID,
      systemInstruction: SYSTEM_INSTRUCTION,
      contents: [{ role: 'user', parts: [{ text: code }] }]
    });
    return result.text;
  });
}

module.exports = generateContent

// Edit code based on a natural-language prompt; returns updated source text
module.exports.editCode = async function (prompt, code) {
  return await generateWithRetry(async () => {
    const result = await ai.models.generateContent({
      model: MODEL_ID,
      systemInstruction:
        "You are an expert code editor. Update the provided code according to the prompt. Return ONLY the complete updated source code without explanations. Prefer no Markdown fences.",
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n${code}` }] }]
    });
    return result.text;
  });
}
