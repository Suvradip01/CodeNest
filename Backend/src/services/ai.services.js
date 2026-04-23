// AI service layer: wraps calls to Groq models for review, code edits,
// live linting, version diffing, debug fixing, and visual execution diagrams.
const Groq = require("groq-sdk")
const crypto = require("crypto")

// Initialize client using API key from environment
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Model to use
const MODEL_ID = "llama-3.3-70b-versatile"
const AI_CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS || 5 * 60 * 1000)
const AI_CACHE_MAX_ENTRIES = Number(process.env.AI_CACHE_MAX_ENTRIES || 200)
const aiCache = new Map()

function getCacheKey(namespace, payload) {
  return `${namespace}:${crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")}`
}

function pruneExpiredCacheEntries(now = Date.now()) {
  for (const [key, entry] of aiCache.entries()) {
    if (entry.expiresAt <= now) aiCache.delete(key)
  }
}

function setCachedValue(key, value) {
  pruneExpiredCacheEntries()
  aiCache.set(key, { value, expiresAt: Date.now() + AI_CACHE_TTL_MS })

  while (aiCache.size > AI_CACHE_MAX_ENTRIES) {
    const firstKey = aiCache.keys().next().value
    aiCache.delete(firstKey)
  }
}

function getCachedValue(key) {
  const entry = aiCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    aiCache.delete(key)
    return null
  }
  return entry.value
}

async function withCache(namespace, payload, operation) {
  const key = getCacheKey(namespace, payload)
  const cached = getCachedValue(key)
  if (cached !== null) return cached

  const result = await operation()
  setCachedValue(key, result)
  return result
}

function extractFirstJsonObject(text) {
  if (!text) throw new Error("Empty model response")

  const cleaned = String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  // Fast path: whole string is JSON
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned

  // Robust path: find the first balanced {...} block
  const start = cleaned.indexOf("{")
  if (start === -1) throw new Error("No JSON object found in model response")

  let depth = 0
  let inString = false
  let stringQuote = null
  let escape = false

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === "\\") {
        escape = true
      } else if (ch === stringQuote) {
        inString = false
        stringQuote = null
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      inString = true
      stringQuote = ch
      continue
    }

    if (ch === "{") depth++
    if (ch === "}") {
      depth--
      if (depth === 0) return cleaned.slice(start, i + 1)
    }
  }

  throw new Error("Unterminated JSON object in model response")
}

function parseModelJson(text) {
  const jsonText = extractFirstJsonObject(text)
  try {
    return JSON.parse(jsonText)
  } catch (e) {
    const err = new Error(`Failed to parse model JSON: ${e.message}`)
    err.cause = e
    err.jsonText = jsonText
    throw err
  }
}

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
- Use LaTeX for mathematical complexity if needed (e.g., $O(n \\log n)$).`

// Helper function to handle retries with exponential backoff
async function generateWithRetry(operation, maxRetries = 3, initialDelay = 2000) {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      const status = error?.status ?? error?.code
      const msg = String(error?.message || "")
      const isRateLimit = status === 429 || msg.includes("429") || msg.includes("rate")
      const isUnavailable = status === 503 || msg.includes("503") || msg.includes("unavailable")

      const isRetryable = isRateLimit || isUnavailable

      if (isRetryable && retries < maxRetries) {
        const delay = initialDelay * Math.pow(2, retries);
        const reason = isRateLimit ? "rate limited" : "temporarily unavailable"
        console.warn(`API ${reason}. Retrying in ${delay}ms... (Attempt ${retries + 1}/${maxRetries})`);
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
  return await withCache("review", { code }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: code }
        ]
      });
      return result.choices[0]?.message?.content || "";
    })
  );
}

module.exports = generateContent

// Edit code based on a natural-language prompt; returns updated source text
module.exports.editCode = async function (prompt, code) {
  return await withCache("edit", { prompt, code }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: "You are an expert code editor. Update the provided code according to the prompt. Return ONLY the complete updated source code without explanations. Prefer no Markdown fences." },
          { role: 'user', content: `${prompt}\n\n${code}` }
        ]
      });
      return result.choices[0]?.message?.content || "";
    })
  );
}

// ─── Feature 1: Live AI Layer ────────────────────────────────────────────────
// Returns structured JSON: { warnings: [], suggestions: [], complexity: string }
module.exports.liveCheck = async function (code, language) {
  return await withCache("live-check", { code, language }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: `You are a real-time code quality analyzer. Analyze the provided ${language} code and return ONLY a valid JSON object (no markdown, no fences) with this exact schema:
{
  "warnings": [{ "line": <number_or_null>, "message": "<string>", "severity": "error|warning" }],
  "suggestions": [{ "line": <number_or_null>, "message": "<string>" }],
  "complexity": "<one of: Simple | Moderate | Complex | Very Complex>"
}
Keep each message under 80 characters. Return at most 5 warnings and 5 suggestions. If code is empty or trivial, return empty arrays.` },
          { role: 'user', content: code }
        ]
      });
      return parseModelJson(result.choices[0]?.message?.content || "");
    })
  );
}

// ─── Feature 3: Versioning — AI Diff Explanation ─────────────────────────────
// Returns a plain-English paragraph explaining what changed between two code versions
module.exports.explainDiff = async function (oldCode, newCode) {
  return await withCache("explain-diff", { oldCode, newCode }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: `You are a code historian. You will be given two versions of code (OLD and NEW).
Write a concise, plain-English summary (3-6 bullet points, using markdown bullets) explaining:
- What was added
- What was removed or changed
- Why the change likely improves the code
Be specific about function names, variable names, and logic changes. Do NOT reproduce the code itself.` },
          { role: 'user', content: `OLD CODE:\n\`\`\`\n${oldCode}\n\`\`\`\n\nNEW CODE:\n\`\`\`\n${newCode}\n\`\`\`` }
        ]
      });
      return result.choices[0]?.message?.content || "";
    })
  );
}

// ─── Feature 4: AI Debug Mode ────────────────────────────────────────────────
// Returns JSON: { errorType, explanation, fixedCode }
module.exports.debugFix = async function (code, errorOutput, language) {
  return await withCache("debug-fix", { code, errorOutput, language }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: `You are an expert ${language} debugger. The user ran their code and got an error.
Analyze the code and the error output, then return ONLY a valid JSON object (no markdown, no fences):
{
  "errorType": "<short error category, e.g. TypeError, SyntaxError, NullPointerException>",
  "explanation": "<plain English explanation of what went wrong and why, 2-4 sentences>",
  "fixedCode": "<complete corrected source code, no fences>"
}
The fixedCode must be the complete working replacement for the original code.` },
          { role: 'user', content: `LANGUAGE: ${language}\n\nCODE:\n${code}\n\nERROR OUTPUT:\n${errorOutput}` }
        ]
      });
      return parseModelJson(result.choices[0]?.message?.content || "");
    })
  );
}

// ─── Feature 5: Visual Execution — Mermaid Diagram ───────────────────────────
// Returns a raw Mermaid flowchart string representing the code's logic flow
module.exports.visualizeCode = async function (code, language) {
  return await withCache("visualize", { code, language }, async () =>
    generateWithRetry(async () => {
      const result = await groq.chat.completions.create({
        model: MODEL_ID,
        messages: [
          { role: 'system', content: `You are a strict code-to-Mermaid translation engine.
Analyze the provided ${language} code and return ONLY a valid Mermaid flowchart definition. 
DO NOT INCLUDE ANY CONVERSATIONAL TEXT, EXPLANATIONS, OR MARKDOWN.
Rules:
1. Start exactly with: flowchart TD
2. Use descriptive node labels. ALL node labels MUST be enclosed in double quotes (e.g., A["label(info)"]).
3. Do NOT use HTML tags in labels.
4. Keep it readable: max 20 nodes.
5. Return raw text only.
Example:
flowchart TD
    A["Start: main()"] --> B["Read input"]` },
          { role: 'user', content: `Create a Mermaid flowchart TD for this code:\n${code}` }
        ]
      });
      
      let text = result.choices[0]?.message?.content || "";
      if (!text) {
        return `flowchart TD\n    A["Error: AI response was empty or blocked"]`;
      }

      text = text.trim();
      const match = text.match(/```(?:mermaid)?\n([\s\S]*?)```/);
      if (match) {
          text = match[1];
      } else {
          text = text.replace(/^```(?:mermaid)?\n?/i, '').replace(/\n?```$/i, '');
      }
      
      // Fallback if the AI just ignored instructions and didn't output flowchart
      if (!text.includes("flowchart")) {
         return `flowchart TD\n    A["AI failed to generate a valid flowchart"]`;
      }
      
      return text.trim();
    })
  );
}
