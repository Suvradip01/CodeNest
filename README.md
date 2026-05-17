# CodeNest

AI-augmented web IDE — multi-language editor, cloud projects, Groq-powered review/debug/visualize, and isolated code execution.

## Interview preparation (full codebase guide)

**Read this before technical interviews:** [INTERVIEW_PREP.md](./INTERVIEW_PREP.md)

That document covers every file, feature, API, data flow, security decision, and common interview Q&A.

---

# CodeNest: Architecture & Feature Reference (summary)

This is a shorter blueprint for the **CodeNest** project. It tears down *every single file, folder, concept, function, and feature implementation* across the entire Full-Stack architecture. 

It is written to give you absolute mastery over the codebase, guaranteeing that you can confidently explain exactly how everything works under the hood during technical interviews. I have consolidated every detail from previous analyses to ensure absolutely nothing is skipped.

---

# 🧠 PART 1: THE BACKEND (`/Backend`)

The backend is an enterprise-grade REST API built with Node.js and Express. It prioritizes resilience (fault-tolerance), raw performance, and secure data handling.

## 1. Core Infrastructure & Root Configuration

### `server.js` - Cluster Manager
Node.js operates on a single-threaded event loop. This file multiplies your server's throughput using the `cluster` module.
- **`cluster.isPrimary`:** The master process checks the number of CPU cores (`os.cpus().length`) and calls `cluster.fork()` for each core.
- **`cluster.on('exit')`:** A self-healing mechanism. If a worker process crashes, the master process immediately respawns a new one to guarantee high availability.

### `package.json` & `.env`
- **Dependencies:** `express`, `mongoose`, `groq-sdk`, `redis`, `archiver`.
- **.env Concept:** Secrets (`JWT_SECRET`, `MONGODB_URI`, `GROQ_API_KEY`) are injected at runtime to prevent leaking credentials to version control.

---

## 2. Express App & Middlewares (`src/app.js` & `src/middleware/`)

### `src/app.js` - The Express Engine & Fallback Execution
- **`createRateLimiter({ name, windowMs, maxRequests })`:** A custom sliding-window rate limiter. 
  - **Implementation:** It calls `rateLimitIncr` on Redis. If Redis is down, it intelligently falls back to an in-memory `Map` (`inMemoryHits`), iterating over timestamps to drop stale requests and enforce the limit, ensuring the app never crashes just because caching fails.
- **`ensureTextPayloadWithinLimit(fieldName, maxBytes)`:** A critical security middleware. It calculates `Buffer.byteLength()` of the request body, rejecting anything over the allowed bytes (e.g., 64KB for code, 128KB for files) to prevent Out-Of-Memory (OOM) DDoS attacks.
- **`/api/code/run` (Execution Fallback Strategy):**
  - Attempts to POST user code to an isolated Dockerized Runner service (`http://runner:3001`).
  - **Fallback Implementation:** If the runner fails, it uses `child_process.spawn`. It dynamically creates a temporary folder in the host OS using `fs.mkdtempSync()`. Depending on the language (JS, Python, Java, C), it writes the code, compiles it (`javac`, `gcc`) if necessary, and spawns the execution process locally. 
  - **Security:** A `setTimeout` of 5000ms is attached to `child.kill()` to ensure infinite loops (like `while(true)`) don't destroy the server CPU.

### `src/middleware/auth.js`
- **`getBearerToken()`:** Splits the `Authorization` header to extract the JWT.
- **`hydrateUserFromToken()`:** Verifies the token using `verifyToken` and performs a MongoDB `findById` to attach the user object to `req.user`.
- **Modes:** Exports `optionalAuth` (allows guests) and `requireAuth` (rejects unauthenticated users).

---

## 3. Database Layer (`src/models/`)

### `Project.js` (Document Embedding Concept)
- In a traditional SQL setup, files would be in a separate table requiring expensive `JOIN` operations. 
- **Implementation:** CodeNest uses NoSQL Document Embedding. The `projectSchema` contains `files: [fileSchema]`. Because IDE workspaces have a bounded number of small text files, storing them inside the Project document guarantees that fetching an entire workspace requires exactly *one disk read*. 
- **Indexing:** `projectSchema.index({ ownerId: 1, name: 1 }, { unique: true })` ensures fast lookups and prevents duplicate project names per user.

### `User.js`
- Standard auth schema. Stores `passwordHash` (never plaintext). Enforces `lowercase` and `trim` on emails.

---

## 4. Business Logic Services (`src/services/`)

### `auth.services.js` - Stateless Cryptography
- **`hashPassword()` & `verifyPassword()`:** Uses Node's native `crypto.scrypt`. Unlike older algorithms (bcrypt/MD5), Scrypt is memory-hard, making it highly resistant to GPU brute-forcing. It generates a random hex salt, hashes the password, and stores it as `salt:hash`.
- **`signToken()` & `verifyToken()`:** Hand-rolled JWT implementation. 
  - Uses `toBase64Url` for headers and payloads.
  - Uses `crypto.createHmac('sha256', TOKEN_SECRET)` to cryptographically sign the payload. This mathematical implementation is lightweight and proves deep security knowledge.

### `project.services.js` - Workspace Management
- **CRUD Functions:** `createProject()`, `saveFile()`, `renameFile()`, `deleteFile()`. Enforces naming and size limits.
- **Caching Implementation (`listProjects`):** It generates a unique key `projectListKey(ownerId)`. Calls `cacheGet(key)`. If it's a miss, it queries MongoDB and calls `cacheSet(key, result)`. 
- **Cache Invalidation:** Any time a file or project is updated, `bustListCache(ownerId)` is called, instantly destroying the stale Redis cache.
- **`zipProject()`:** Uses the `archiver` library. Instead of writing a ZIP file to disk, it reads the files from MongoDB memory and pipes them *directly* into the HTTP response stream (`archive.pipe(outStream)`), achieving zero disk I/O.

### `ai.services.js` - The LLM Brain (Groq Integration)
- **`withCache()` (In-Memory LRU):** Hashes the user's prompt using `crypto.createHash('sha256')`. Stores the AI response in a `Map`. If the user asks the exact same question, it responds in 0ms, saving massive API costs. `pruneExpiredCacheEntries()` aggressively cleans up stale data.
- **`generateWithRetry()` (Exponential Backoff):** Wraps API calls. If Groq throws a 429 (Rate Limit) or 503 (Server Overload), it catches the error, waits 2s, retries, waits 4s, etc., up to 3 times.
- **`extractFirstJsonObject()`:** LLMs often hallucinate and wrap JSON in markdown (```json). This custom algorithm acts like an AST parser, counting opening `{` and closing `}` brackets to perfectly extract raw JSON from conversational garbage.
- **AI Endpoints:**
  - `getReview`: Code reviews.
  - `editCode`: Direct code modifications via natural language.
  - `liveCheck`: Returns structured JSON for real-time linting warnings/suggestions.
  - `explainDiff`: Natural language explanation of version history.
  - `debugFix`: Takes code + stderr, returns a parsed `fixedCode`.
  - `visualizeCode`: Prompts the LLM to write raw Mermaid SVG flowcharts.

---

## 5. Routes & Controllers (`src/routes/` & `src/controllers/`)
- **Concept:** Routers define the URL endpoints and map them to the service functions.
- **Implementation:** `ai.routes.js`, `auth.routes.js`, and `project.routes.js` extract data from `req.body` or `req.params`, pass it to the service, and handle `try/catch` blocks. They normalize HTTP Status codes (e.g., 400 for Bad Request, 503 for Service Unavailable).

---

## 6. Infrastructure Integration (`src/cache/`)

### `redis.js` - Fault-Tolerant Cache
- **Concept:** A Singleton connection pattern.
- **Implementation:** It listens for `error` events. If the connection drops, it sets `connected = false`. Every function (`cacheGet`, `cacheSet`, `rateLimitIncr`) checks this flag. If false, they return `null` immediately. This ensures that a Redis crash gracefully disables caching rather than bringing down the entire API.

---
---

# 🎨 PART 2: THE FRONTEND (`/Frontend`)

The frontend is an aggressively optimized React SPA (Vite + TailwindCSS). It utilizes advanced state management, debouncing, and optimistic UI updates to mimic a native desktop IDE.

## 1. App State & The Orchestrator (`src/App.jsx`)
This massive file is the nervous system. It manages global state and controls view rendering without triggering page reloads.

### Key State Variables
- `view`: ('landing', 'desktop', 'dashboard') Controls routing without React Router.
- `code`, `language`, `output`, `stderrLines`: The core IDE state.
- `session`: The authenticated user object.

### Advanced Implementations (Debouncing)
- **Auto-Save (`saveDebounceRef`):** Every time `code` changes, a `useEffect` runs. It triggers `setTimeout(..., 2000)`. If the user types again within 2 seconds, `clearTimeout` destroys the timer. When typing finally stops, it silently calls `updateFileContent`.
- **Live Analysis (`liveDebounceRef`):** Uses the exact same debounce logic. After 2 seconds of inactivity, it hits the backend `/ai/live-check`, triggering the `LiveHintsPanel` to show warnings and complexity.

### Core Feature Functions
- **`runCode()`:** Calls the API, sets `output`, checks for errors using regex (`detectErrors`), populates `stderrLines`, and updates `useVersionStore`.
- **`handleAutoFix()`:** Triggered from the Terminal. Feeds `stderrLines` and `code` to the AI, and injects the `fixedCode` back into the editor.
- **`reviewCode()` & `handleVisualize()`:** Fetches markdown reviews and Mermaid diagrams.

---

## 2. State Management Custom Hooks (`src/hooks/`)
Instead of using heavy libraries like Redux or Zustand, the app uses custom React hooks to manage global, isolated logic perfectly.

### `useProjectStore.js` (Workspace State)
- **State:** `projects` (array), `activeProjectId`, `activeFileId`.
- **Optimistic UI Implementation:** Look at `createFile()`. When called, it *immediately* updates the React `projects` state using `setProjects(prev => [...prev, newFile])` so the user sees the file instantly in the sidebar. It *then* awaits the API call (`saveFileApi`) in the background.

### `useVersionStore.js` (Time-Travel Local Storage)
- **Concept:** Local Version Control.
- **Implementation:** `loadStore()` reads from `localStorage`. 
- **`saveSnapshot()`:** Whenever `runCode` or `reviewCode` is clicked, this function pushes the current code into an array. To prevent browser memory leaks, it slices the array (`[snap, ...prev.versions].slice(0, MAX_VERSIONS)`), maintaining exactly 50 history states without manual cleanup.

---

## 3. Network Layer (`src/services/api.js`)
- **`resolveApiBaseUrl()`:** Dynamically determines if the app is in Dev (hitting `/api`) or Prod (hitting full URLs) via Vite's `import.meta.env`.
- **`setAuthToken()`:** Injects the JWT globally into `apiClient.defaults.headers.common.Authorization`.
- **Functions:** Every single backend route is wrapped in an exported async function (e.g., `getReview`, `liveCheck`, `explainDiff`).

---

## 4. Complex UI Components (`src/components/`)

### `EditorPanel.jsx` (The Typing Engine)
- Uses `react-simple-code-editor` as the controlled input.
- **Syntax Highlighting:** Uses `prismjs`. Every keystroke updates state, triggering Prism to evaluate the text, mapping language keywords (JS/Python) into HTML `<span>` tags, and injecting Tailwind classes for coloration.

### `ReviewPanel.jsx` (Dual-Rendering Interface)
- **Markdown Tab:** Uses `react-markdown` to parse AI text into HTML, using `rehype-highlight` to inject syntax coloring inside AI code blocks.
- **Visual Flow Tab (`MermaidRenderer`):** 
  - Isolates the DOM using `useRef`. Uses `mermaid.render()` to parse the AI text into an SVG flowchart.
  - Wraps the SVG in `react-zoom-pan-pinch` (`<TransformWrapper>`), transforming mouse scrolling into SVG scaling and mouse dragging into SVG panning, giving it an infinite-canvas feel.
  - Uses `html-to-image` (`toPng()`) to let users export the diagram as a PNG.

### `ProjectSidebar.jsx` (Recursive File Explorer)
- Iterates over `projects`. If expanded, iterates over `project.files`.
- **`InlineInput` Component:** When the user clicks the Edit icon, the text `<span>` swaps to an `<input autoFocus />`. It captures the `Enter` key to trigger `renameProject` or `renameFile` API calls, cleanly handling UX.

### `LiveHintsPanel.jsx` (The AI Floating Widget)
- Uses absolute positioning (`fixed top-20 right-4`).
- Dynamically maps the array of `hints.warnings` and `hints.suggestions` into UI cards. Calculates the `complexity` string (Simple, Moderate, Complex) to inject specific Tailwind color classes (e.g., `text-emerald-400` vs `text-red-400`).

### `TerminalPanel.jsx` (Execution Output)
- Iterates over the `output` array. 
- Uses string matching (`.includes('Error')`, `.includes('Traceback')`) on every single line. If it finds an error, it tints the line red and forces the `hasError` state true, exposing the "Debug with AI" button.

### `VersionTimeline.jsx` & `AuthDialog.jsx`
- **VersionTimeline:** Renders the history array from `useVersionStore`. Maps versions into a visual timeline and triggers `onExplainDiff` to ask Groq to explain what changed between version $N$ and version $N-1$.
- **AuthDialog:** A modal overlay handling Login/Register forms. It submits to `App.jsx` via prop-drilling (`onSubmit={handleAuthSubmit}`).

---

## 🎤 Interview Preparation: Master Q&A

Use these answers to prove full-stack mastery during interviews.

### Q: Why did you choose React and custom hooks over Redux for the frontend?
**A:** "For a web IDE, state is highly localized to specific panels (e.g., the file explorer vs the code editor). Using custom hooks like `useProjectStore` provided a lightweight, Zustand-like approach that kept the state close to where it's used. Redux would have added massive boilerplate, whereas hooks allowed me to encapsulate API calls and optimistic UI state mutations cleanly."

### Q: How do you handle real-time AI analysis without bankrupting your API limits?
**A:** "I implemented a two-tier defense. On the **Frontend**, I use debouncing (`setTimeout` with `clearTimeout`) so the API is only hit 2 seconds *after* the user stops typing. On the **Backend**, I implemented an LRU (Least Recently Used) in-memory cache in `ai.services.js`. If a user requests an analysis for code that has already been analyzed, the backend returns the cached result instantly, bypassing the expensive Groq LLM API call entirely."

### Q: Why use Node Clustering? What problem does it solve?
**A:** "Node.js operates on a single-threaded event loop. If one request requires heavy computation, it blocks all other users. By using the built-in `cluster` module in `server.js`, I fork multiple worker processes based on the number of CPU cores. The OS balances incoming traffic across these workers, multiplying my server's throughput and ensuring high availability if one worker crashes."

### Q: How is your database structured and why?
**A:** "I use MongoDB because of its flexible document model. A key design choice was embedding files directly inside the `Project` document (`files: [fileSchema]`). In an IDE, you almost never need to query a file completely isolated from its project. Embedding them ensures that fetching a workspace requires exactly a single disk seek, which is vastly faster than performing relational JOINs across multiple tables."

### Q: Executing user code is dangerous. How do you secure it?
**A:** "Executing arbitrary code is the biggest risk in an IDE. I architected an isolated, ephemeral Runner microservice (via Docker) to handle execution. However, I also engineered a highly resilient fallback in `app.js`. If the runner dies, the backend spawns a local `child_process`. Crucially, this process writes to the OS temp directory and is strictly enforced by a 5000ms timeout (`setTimeout` that triggers `child.kill()`). This prevents malicious infinite loops from hanging the server CPU."

### Q: How did you implement authentication?
**A:** "I built a stateless JWT authentication system from scratch to minimize dependency vulnerabilities. I used Node's native `crypto.scrypt`—which is memory-hard and GPU-resistant—with random salts for password hashing. For session management, I constructed standard JWTs using base64 encoding and HMAC-SHA256 signatures, storing the token client-side and passing it via the `Authorization: Bearer` header."

### Q: How did you make the UI feel so fast, even on slow networks?
**A:** "I heavily utilized Optimistic UI updates. For example, in `useProjectStore`, when a user creates a new file, my code immediately pushes the new file object into the React state array (`setProjects`). The UI updates instantly. In the background, it awaits the Axios POST request. This masks network latency perfectly."

---
*End of Reference Codex.*
