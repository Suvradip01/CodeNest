# CodeNest — Complete Interview Preparation Guide

> **Purpose:** This document explains **every file, feature, concept, and design decision** in the CodeNest full-stack project so you can confidently answer technical interviews. Read it top-to-bottom once, then use sections as flashcards.

---

## Table of Contents

1. [What Is CodeNest?](#1-what-is-codenest)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Repository Structure (Every Folder & File)](#3-repository-structure-every-folder--file)
4. [Backend — Deep Dive](#4-backend--deep-dive)
5. [Runner Microservice](#5-runner-microservice)
6. [Frontend — Deep Dive](#6-frontend--deep-dive)
7. [Docker & Deployment](#7-docker--deployment)
8. [CI/CD](#8-cicd)
9. [End-to-End Feature Flows](#9-end-to-end-feature-flows)
10. [API Reference](#10-api-reference)
11. [Environment Variables](#11-environment-variables)
12. [Security Model](#12-security-model)
13. [Interview Q&A (With Answers)](#13-interview-qa-with-answers)

---

## 1. What Is CodeNest?

**CodeNest** is an **AI-augmented web IDE** — a browser-based coding environment where users can:

| Feature | What it does |
|---------|----------------|
| **Multi-language editor** | Write JavaScript, Python, Java, or C with syntax highlighting |
| **Code execution** | Run code in an isolated Runner service (Docker) |
| **AI code review** | Groq LLM (`llama-3.3-70b-versatile`) produces structured markdown reviews |
| **Natural-language edits** | "Refactor to async" → AI returns updated source |
| **Live AI hints** | Debounced real-time warnings, suggestions, complexity badge |
| **AI debug mode** | Feed stderr → get explanation + fixed code |
| **Visual flowcharts** | AI generates Mermaid diagrams from code logic |
| **Version history** | Local snapshots in `localStorage` with diff + AI explain |
| **Project workspace** | CRUD projects/files in MongoDB, ZIP download |
| **Auth** | Register/login with JWT + bcrypt password hashing |
| **macOS-style desktop** | Landing → faux macOS desktop → IDE dashboard |

**Tech stack summary:**

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Axios, Prism, Mermaid |
| Backend | Node.js 20, Express 5, Mongoose, Groq SDK, Redis |
| Execution | Separate Express Runner + Docker isolation |
| Data | MongoDB Atlas, Redis (cache + rate limits) |
| Deploy | Docker Compose, GitHub Actions |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Browser (React SPA)                              │
│  Landing → Desktop → Dashboard (Editor, Terminal, AI panels)            │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS /api/*
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              Express App (clustered workers in production)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Auth    │ │ Projects │ │   AI     │ │ Code Run │ │ Static FE    │  │
│  │  routes  │ │  routes  │ │  routes  │ │  proxy   │ │ dist/        │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────────┘  │
│       │             │            │            │                          │
│       ▼             ▼            ▼            ▼                          │
│  auth.services  project.services  ai.services   axios → Runner          │
└───────┬─────────────┬────────────────┬──────────────┬───────────────────┘
        │             │                │              │
        ▼             ▼                ▼              ▼
   MongoDB        Redis cache      Groq API      Runner :3001
   (Users,        (lists, rate      (LLM)         (child_process
    Projects)      limits)                        in temp dirs)
```

**Why three processes?**

1. **Main app** — API, auth, AI, serves built frontend.
2. **Runner** — Untrusted code never runs in the API process; network-isolated in Docker.
3. **Redis** — Optional; app degrades gracefully if Redis is down.

---

## 3. Repository Structure (Every Folder & File)

```
CodeNest/
├── .github/workflows/deploy.yml   # CI: build FE + validate Docker
├── .gitignore
├── AppPreview.png                 # Screenshot for README/marketing
├── docker-compose.yml             # app + runner + redis orchestration
├── Dockerfile.app                 # Main backend image (compilers included)
├── Dockerfile.runner              # Isolated execution image
├── README.md                      # Project overview
├── INTERVIEW_PREP.md              # This file
│
├── Backend/
│   ├── server.js                  # Cluster primary → fork workers
│   ├── package.json
│   ├── .env                       # Secrets (not in git)
│   ├── projects/                  # Legacy/volume mount path (Docker)
│   └── src/
│       ├── app.js                 # Express app (lightweight bootstrapper)
│       ├── cache/redis.js         # Redis singleton + graceful fallback
│       ├── db/
│       │   └── db.js              # Database connection logic
│       ├── controllers/
│       │   ├── ai.controller.js   # AI logic handlers
│       │   ├── auth.controller.js # Authentication logic handlers
│       │   ├── code.controller.js # Sandboxed execution runner controller
│       │   ├── health.controller.js # Health check & metrics controller
│       │   └── project.controller.js # Project operations controller
│       ├── middleware/
│       │   ├── auth.js            # JWT Bearer middleware
│       │   ├── logger.js          # Request logger middleware
│       │   ├── payload.js         # Text payload validator
│       │   └── rateLimiter.js     # Decoupled rate-limit guards
│       ├── models/User.js         # User schema
│       ├── models/Project.js      # Project + embedded files
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── project.routes.js
│       │   ├── ai.routes.js       # AI actions router
│       │   ├── code.routes.js     # Code execution router
│       │   └── health.routes.js   # Health/Metrics monitoring router
│       ├── services/
│       │   ├── auth.services.js
│       │   ├── project.services.js
│       │   └── ai.services.js
│       └── utils/
│           └── metrics.js         # Performance metrics state tracker
│
├── Frontend/
│   ├── index.html                 # Vite entry HTML
│   ├── vite.config.js             # React plugin, Tailwind, /api proxy
│   ├── tailwind.config.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── .env                       # VITE_API_URL, etc.
│   ├── public/icons/              # Desktop wallpaper, dock icons
│   ├── dist/                      # Production build (served by backend)
│   └── src/
│       ├── main.jsx               # React root + ThemeProvider
│       ├── App.jsx                # Root orchestrator (views, state, handlers)
│       ├── index.css              # Global Tailwind + custom scrollbars
│       ├── assets/react.svg
│       ├── services/api.js        # Axios client + all API wrappers
│       ├── hooks/
│       │   ├── useProjectStore.js
│       │   └── useVersionStore.js
│       ├── lib/utils.js           # cn() for Tailwind class merge
│       └── components/
│           ├── LandingPage.jsx
│           ├── Desktop.jsx
│           ├── Topbar.jsx
│           ├── EditorPanel.jsx
│           ├── ReviewPanel.jsx
│           ├── TerminalPanel.jsx
│           ├── PromptPanel.jsx
│           ├── LiveHintsPanel.jsx
│           ├── ProjectSidebar.jsx
│           ├── VersionTimeline.jsx
│           ├── DiffViewer.jsx
│           ├── DebugPanel.jsx
│           ├── AuthDialog.jsx
│           ├── theme-provider.jsx
│           ├── ui/button.jsx
│           └── desktop/
│               ├── MenuBar.jsx
│               ├── Dock.jsx
│               ├── Finder.jsx
│               └── DesktopIcon.jsx
│
└── Runner/
    ├── package.json
    └── server.js                  # POST /run execution queue
```

**Architectural Note:** CodeNest follows a production-level modular architecture (**routes ➔ controllers ➔ services ➔ models**). The Express routers in `routes/` intercept and validate requests, controllers in `controllers/` contain request handling logic, services in `services/` abstract business rules/APIs, and models in `models/` define schemas. This strictly separates concerns and keeps `app.js` lightweight.

---

## 4. Backend — Deep Dive

### 4.1 `Backend/server.js` — Process Clustering

**Why needed:** Node.js uses one thread per process. CPU-heavy work (JSON parsing, many concurrent requests) on one thread blocks everyone.

**How it works:**

```javascript
if (cluster.isPrimary) {
  for (let i = 0; i < WORKERS; i++) cluster.fork();
  cluster.on('exit', () => cluster.fork()); // auto-respawn
} else {
  require('./src/app').listen(PORT);
}
```

| Setting | Dev | Production |
|---------|-----|------------|
| `WORKERS` | 1 (easy debugging) | `os.cpus().length` or `CLUSTER_WORKERS` |

**Interview line:** *"I used the cluster module for horizontal scaling within one machine — each worker is a full Express instance sharing nothing except the DB connection pool."*

---

### 4.2 `Backend/src/app.js` — Express Application Core

**Responsibilities:**

`app.js` acts as a lightweight entrypoint bootstrapper that wires modular elements together:
1. Calls database module initialization (`connectDB()`)
2. Registers global middleware (CORS, JSON body, request logging)
3. Mounts decoupled routers (auth, projects, ai, code, health) with appropriate rate limiters and auth guards
4. Serves `Frontend/dist` static SPA files with a fallback catch-all handler

By offloading endpoint logic to separate controllers and routers, `app.js` stays clean and readable (under 65 lines).

#### Request ID & structured logging

Every request gets `req.requestId = crypto.randomUUID()` and `X-Request-Id` header. On `res.finish`, logs JSON: method, path, status, duration.

#### `createRateLimiter({ name, windowMs, maxRequests })`

**Purpose:** Protect AI APIs, code execution, and project CRUD from abuse.

**Two-tier implementation:**

1. **Redis (preferred):** `rateLimitIncr(key, windowSeconds)` — atomic `INCR` + `EXPIRE` on first hit.
2. **In-memory fallback:** If Redis returns `null`, store timestamps in `Map`, filter by `windowMs`, return `429` with `Retry-After`.

**Client key:** `req.user?.id || req.ip` — authenticated users get per-user limits.

| Limiter | Default window | Default max |
|---------|----------------|-------------|
| `ai` | 60s | 20 |
| `execution` | 60s | 10 |
| `projects` | 60s | 60 |

#### `ensureTextPayloadWithinLimit(fieldName, maxBytes)`

Uses `Buffer.byteLength(value, 'utf8')` — prevents huge bodies from causing OOM. Returns **413** if exceeded.

| Field | Default limit |
|-------|---------------|
| `code` | 64 KB |
| `prompt` | 8 KB |
| `errorOutput` | 32 KB |

#### Dual route paths

Many endpoints register **both** `/api/...` and `/...` (e.g. `/api/ai/live-check` and `/ai/live-check`) for flexibility behind proxies.

#### Code execution route `POST /api/code/run`

**Flow:**

1. Validate `code` present
2. `axios.post(RUNNER_URL + '/run', { code, language }, { timeout: 15000 })`
3. On failure: if `ALLOW_LOCAL_EXECUTION_FALLBACK=true`, spawn local `child_process` in `os.tmpdir()` with **5s kill timeout**
4. Else return **503** with friendly message

**Supported languages in fallback:** JS (`node`), Python (`python3`), Java (`javac` + `java`), C (`gcc` + `./main`).

**Why fallback exists:** Resilience when Runner container is down; disabled by default in production for security.

#### Static frontend & SPA fallback

- `express.static(Frontend/dist)`
- `GET /` → `index.html` if built, else plain text

#### Observability

- `GET /api/health` — MongoDB state, Groq key presence, auth flags, uptime
- `GET /api/metrics` — request counts by route/status, `process.memoryUsage()`

---

### 4.3 `Backend/src/middleware/auth.js`

| Export | Behavior |
|--------|----------|
| `isAuthRequired()` | `process.env.AUTH_REQUIRED !== 'false'` |
| `getBearerToken(req)` | Extract JWT from `req.cookies.token` (primary) or `Authorization: Bearer <token>` (fallback) |
| `hydrateUserFromToken(token)` | `verifyToken` → `User.findById` → `sanitizeUser` |
| `optionalAuth` | Sets `req.user` if valid token; else continues |
| `requireAuth` | **401** if no/invalid token |
| `requireAuthIfConfigured` | Uses `requireAuth` when auth required, else `optionalAuth` |

**Why hydrate from DB:** JWT only has `sub` (user id). DB lookup ensures deleted users cannot use old tokens.

---

### 4.4 `Backend/src/models/User.js`

| Field | Purpose |
|-------|---------|
| `email` | Unique, lowercase, trimmed |
| `name` | Optional display name, max 80 chars |
| `passwordHash` | `salt:hex` from scrypt — **never plaintext** |
| `createdAt` | Registration time |

---

### 4.5 `Backend/src/models/Project.js` — Document Embedding

**Sub-schema `fileSchema`:**

```javascript
{ name, content, language, updatedAt }
```

**Project schema:**

```javascript
{ name, ownerId (ref User), files: [fileSchema], createdAt, updatedAt }
```

**Indexes:**

- `{ ownerId: 1, updatedAt: -1 }` — list projects sorted by recency
- `{ ownerId: 1, name: 1 }` unique — no duplicate project names per user

**Why embed files (not separate collection):**

- IDE always loads **whole workspace** together
- **One MongoDB read** = all files (no JOINs)
- Trade-off: MongoDB 16MB doc limit — mitigated by `MAX_FILES_PER_PROJECT` (100) and `MAX_FILE_CONTENT_BYTES` (128KB)

**Anonymous projects:** `ownerId` can be absent (`$exists: false`) when auth is off.

---

### 4.6 `Backend/src/services/auth.services.js`

This service is structured to strictly mirror the chronological flow of security concepts:
1. **Validation & Sanitization** (`validateCredentials`, `normalizeEmail`, `sanitizeUser`)
2. **Verification & Hashing** (`hashPassword`, `verifyPassword` using `bcryptjs`)
3. **Authentication & Sessions** (`signToken`, `verifyToken` with HS256 algorithm pinning, `createSession`)
4. **High-Level Entry Points** (`registerUser`, `loginUser`)

#### Password hashing — `bcryptjs`

- Automatic salt generation with 10 salt rounds
- High-level `bcrypt.hash` and `bcrypt.compare` methods
- Built-in resistance to timing-attacks

**Why bcrypt:** Industry-standard adaptive hashing algorithm designed specifically for passwords. Resists brute-force attacks via a customizable work factor (rounds).

#### JWT — Industry Standard (`jsonwebtoken` package)

```javascript
const jwt = require('jsonwebtoken');
token = jwt.sign(payload, secret, { expiresIn: ttl, algorithm: 'HS256' });
```

- Payload: `{ sub, email }` (with `iat` and `exp` claims generated natively by `jsonwebtoken` via `expiresIn` options)
- `verifyToken` enforces `{ algorithms: ['HS256'] }` to block "algorithm confusion attacks" (e.g. preventing attackers from submitting tokens signed with asymmetric keys or `none`)
- Default TTL: 7 days (`JWT_TTL_SECONDS`)

#### `registerUser` / `loginUser`

- Email regex + no `..` in local part
- Password min 8 chars
- Register: **409** if email exists
- Login: generic "Invalid email or password" (no user enumeration)

#### `createSession(user)`

Returns `{ token, user: { id, email, name, createdAt } }`.

---

### 4.7 `Backend/src/services/project.services.js`

| Function | What it does |
|----------|--------------|
| `listProjects(ownerId)` | Redis cache read → MongoDB → cache write (60s TTL) |
| `createProject(name, ownerId)` | New doc, bust cache |
| `renameProject(id, name, ownerId)` | Unique name per owner |
| `saveFile(projectId, fileNameOrId, content, ownerId)` | Upsert file; detect language from extension |
| `renameFile` | Prevent duplicate filenames |
| `deleteFile` / `deleteProject` | Filter/delete + bust cache |
| `zipProject(projectId, outStream, ownerId)` | `archiver` streams ZIP to HTTP response — **zero disk write** |

**Validation helpers:**

- No `..`, `/`, `\` in filenames (path traversal prevention)
- `ensureFileContent` byte limit
- `MAX_FILES_PER_PROJECT` cap

**Language detection from extension:**

| Extension | Language |
|-----------|----------|
| `.js` | javascript |
| `.py` | python |
| `.java` | java |
| `.c` | c |

---

### 4.8 `Backend/src/services/ai.services.js` — Groq LLM Layer

**Model:** `llama-3.3-70b-versatile` via `groq-sdk`.

#### In-memory AI cache (`withCache`)

- Key: `namespace + SHA256(JSON.stringify(payload))`
- TTL: 5 minutes (`AI_CACHE_TTL_MS`)
- Max 200 entries; evicts oldest when full
- **Saves API cost** on repeated identical prompts

#### `generateWithRetry`

Exponential backoff on **429** (rate limit) or **503** (unavailable): 2s → 4s → 8s, max 3 retries.

#### `extractFirstJsonObject` / `parseModelJson`

LLMs often wrap JSON in markdown fences. The parser:

1. Strips ```json fences
2. If not clean JSON, scans for balanced `{...}` respecting strings/escapes
3. `JSON.parse` with helpful errors

#### AI features (exported functions)

| Function | Endpoint | Output |
|----------|----------|--------|
| `generateContent(code)` | get-review | Markdown review (Principal Engineer persona) |
| `editCode(prompt, code)` | edit-code | Raw updated source |
| `liveCheck(code, language)` | live-check | `{ warnings[], suggestions[], complexity }` |
| `explainDiff(old, new)` | explain-diff | Markdown bullet summary |
| `debugFix(code, errorOutput, lang)` | debug-fix | `{ errorType, explanation, fixedCode }` |
| `visualizeCode(code, language)` | visualize | Mermaid `flowchart TD` string |

**Review system prompt** enforces sections: Executive Audit, Architecture, Critical Issues, Refactoring, Proposed Solution.

---

### 4.9 Routes

#### `auth.routes.js`

| Method | Path | Handler |
|--------|------|---------|
| POST | `/register` | `authController.register` → 201 + session & cookie |
| POST | `/login` | `authController.login` → session & cookie |
| POST | `/logout` | `authController.logout` → clear cookie |
| GET | `/me` | `requireAuth` → `authController.me` |

#### `project.routes.js`

| Method | Path | Handler |
|--------|------|---------|
| GET | `/` | `projectController.listProjects` → lists all owned projects |
| POST | `/` | `projectController.createProject` → creates new project |
| PATCH | `/:projectName` | `projectController.renameProject` → renames project |
| POST | `/:projectName/files` | `projectController.saveFile` → saves/creates file |
| PATCH | `/:projectName/files/:fileName` | `projectController.renameFile` → renames file |
| DELETE | `/:projectName/files/:fileName` | `projectController.deleteFile` → deletes file |
| DELETE | `/:projectName` | `projectController.deleteProject` → deletes project |
| GET | `/:projectName/download` | `projectController.downloadProject` → streams ZIP archive |

`getStatusCode(error)` maps message patterns to 400/404/500.

#### `ai.routes.js`

Only `getReview` and `editCode` — others are inline in `app.js` for shared error handling patterns.

---

### 4.10 `Backend/src/cache/redis.js`

**Singleton pattern:** `getClient()` connects once; `connected` flag flipped on `error`/`ready`.

| Function | On Redis down |
|----------|---------------|
| `cacheGet` | `null` (cache miss) |
| `cacheSet` | no-op |
| `cacheDel` | no-op |
| `rateLimitIncr` | `null` → triggers in-memory limiter |

**Design principle:** *Redis is an optimization, not a dependency.*

---

## 5. Runner Microservice

**File:** `Runner/server.js`  
**Port:** 3001 (internal Docker network only — **no public port**)

### Why separate service?

| Risk | Mitigation in Runner |
|------|---------------------|
| Arbitrary code execution | Not in API process |
| Infinite loops | `TIMEOUT_MS` (5s) → `SIGKILL` |
| Resource exhaustion | `MAX_CONCURRENT=2`, `MAX_QUEUE_SIZE=25` |
| Large payloads | `MAX_CODE_BYTES` 64KB |

### Execution queue

```javascript
enqueueExecution(() => executeCode(code, language))
```

- `activeCount` tracks running jobs
- `drainQueue()` starts new jobs when slot free
- Queue full → **429**

### `executeCode`

1. `fs.mkdtempSync` in OS temp
2. Write source file
3. Compile if Java/C
4. `spawn` with minimal env (`PATH`, `HOME=/tmp`)
5. `finally`: `fs.rm` temp dir

### Response shape

```json
{
  "output": ["line1", "line2"],
  "stderr": ["error line"],
  "exitCode": 0,
  "activeCount": 1,
  "queuedCount": 0
}
```

---

## 6. Frontend — Deep Dive

### 6.1 View state machine (`App.jsx`)

No React Router — manual `view` state:

| `view` | Screen |
|--------|--------|
| `'landing'` | Marketing page |
| `'desktop'` | macOS-style desktop |
| `'dashboard'` | Full IDE |

**Gate:** `session?.token` required for desktop/dashboard. Unauthenticated users see landing + `AuthDialog`.

### 6.2 Bootstrap sequence

1. `fetchHealth()` — verify backend up
2. If `localStorage` has token → `getCurrentUserApi()` hydrate session
3. Invalid token → `clearStoredSession()`

### 6.3 Core state in `App.jsx`

| State | Purpose |
|-------|---------|
| `code`, `language` | Editor content |
| `output`, `stderrLines`, `hasError` | Terminal |
| `review`, `mermaidDiagram` | AI panels |
| `liveHints`, `showLivePanel` | Live AI layer |
| `prompt` | NL edit box |
| `session` | `{ token, user }` |
| `showProjectSidebar`, `showVersionPanel`, `showDebugPanel` | Panel toggles |

### 6.4 Debouncing (critical interview topic)

**Auto-save** (`saveDebounceRef`, 2000ms):

- When `code` changes and active file exists
- `clearTimeout` on each keystroke
- Calls `updateFileContent(projectId, fileId, code)`
- `isSaving` ref prevents re-entry loops

**Live check** (`liveDebounceRef`, 2000ms):

- Only when `showLivePanel` is true
- Calls `liveCheck(code, language)`
- Empty code → clear hints

**Why 2 seconds:** Balance UX (not spamming API) vs freshness.

### 6.5 Key handlers

| Handler | Flow |
|---------|------|
| `runCode` | `saveSnapshot` → `runCodeApi` → set output → `detectErrors` regex |
| `reviewCode` | snapshot → `getReview` → set markdown |
| `applyPrompt` | `editCode` → `extractCode` (strip markdown fences) |
| `handleAutoFix` | `debugFix` → apply `fixedCode` to editor |
| `handleVisualize` | `visualizeCode` → `mermaidDiagram` |
| `handleRestore` | snapshot current → load old code from version |

### 6.6 `services/api.js`

**`resolveApiBaseUrl()`:**

- Dev: `/api` (Vite proxy → `localhost:3000`)
- Prod: `VITE_API_URL` with `/api` suffix

**Session persistence:**

- Key: `codenest-session` in `localStorage`
- Boot: `setAuthToken` on axios defaults

**All API functions** mirror backend routes (see API Reference).

### 6.7 `useProjectStore.js`

Custom hook = lightweight global store (no Redux).

| Method | Pattern |
|--------|---------|
| `createFile` | API call → update state (not optimistic for create — awaits API) |
| `updateFileContent` | **Optimistic:** `setProjects` first, then `saveFileApi` |
| `reloadProjects` | On `enabled` change (login/logout) |

`enabled: workspaceEnabled` — only loads projects when logged in.

### 6.8 `useVersionStore.js`

**Client-side only** — not synced to server.

- `localStorage` key: `codenest_versions`
- Max **50** snapshots (`slice(0, MAX_VERSIONS)`)
- Each snapshot: `{ id, timestamp, language, code, label? }`

**Why localStorage:** Fast time-travel without DB writes; good for interview demos.

### 6.9 Component reference

#### `LandingPage.jsx`

- Typing animation hook (`useTyping`)
- Feature cards (execution, AI review, visual flow, etc.)
- CTA → `onLaunch` / `onSignIn` / `onSignUp`

#### `Desktop.jsx` + `desktop/*`

| File | Role |
|------|------|
| `MenuBar.jsx` | Top macOS menu strip |
| `Dock.jsx` | Magnifying dock icons; `vscode` launches IDE |
| `Finder.jsx` | Fake Finder window with user guide |
| `DesktopIcon.jsx` | Desktop shortcut icons |

**`Dock.jsx` detail:** macOS magnification — hover scales adjacent icons via `dockScale` array.

#### `Topbar.jsx`

- Language dropdown (resets code to `SNIPPETS[lang]`)
- Toggles: Projects, Live AI, History, Visualize
- Theme toggle (light/dark)
- Review button with loading state
- User chip + logout

#### `EditorPanel.jsx`

- `react-simple-code-editor` — textarea + highlight overlay
- `prism.highlight` per language grammar
- Run button → `onRun`

#### `ReviewPanel.jsx`

- Tab 1: `react-markdown` + `rehype-highlight`
- Tab 2: `MermaidRenderer` — `mermaid.render()` → SVG
- `react-zoom-pan-pinch` for pan/zoom
- `html-to-image` `toPng()` export

#### `TerminalPanel.jsx`

- Renders `output[]` lines
- Error styling if line matches Error/Traceback/Exception
- "Debug with AI" when `hasError`

#### `PromptPanel.jsx`

- Textarea + Enter to submit (Shift+Enter for newline)
- Calls `onApply` → `editCode` flow

#### `LiveHintsPanel.jsx`

- Fixed position top-right
- Complexity badge colors (Simple → Very Complex)
- Maps `warnings` / `suggestions` arrays

#### `ProjectSidebar.jsx`

- Tree: projects → files
- `InlineInput` for rename/create (Enter confirm, Escape cancel)
- ZIP download per project
- Language picker when creating files

#### `VersionTimeline.jsx`

- Sliding drawer from right
- Compare mode + `DiffViewer`
- "AI Explain" between two versions
- Restore / label / delete snapshots

#### `DiffViewer.jsx`

- **LCS dynamic programming** diff algorithm
- Side-by-side Before/After with line numbers
- Pure JS — no external diff library

#### `DebugPanel.jsx`

- Shows stderr lines
- "Auto Fix with AI" → displays explanation + success state

#### `AuthDialog.jsx`

- Login/register tabs
- Client-side validation mirrors backend
- Animated height on mode switch

#### `theme-provider.jsx`

- React Context for `light` / `dark` / `system`
- Persists to `localStorage` (`vite-ui-theme`)
- Toggles `document.documentElement` class

#### `ui/button.jsx` + `lib/utils.js`

- shadcn-style `Button` with `class-variance-authority`
- `cn()` = `twMerge(clsx(...))` for Tailwind classes

### 6.10 Build tooling

**`vite.config.js`:**

- `@` alias → `./src`
- Dev proxy: `/api` → `VITE_API_PROXY_TARGET` (default `http://localhost:3000`)

**Production:** `npm run build` → `Frontend/dist` copied/served by Express.

---

## 7. Docker & Deployment

### `docker-compose.yml` — three services

| Service | Role | Security |
|---------|------|----------|
| `app` | Main API + static FE | Port 3000 public; read-only root FS; tmpfs `/tmp` |
| `runner` | Code execution | **No public ports**; internal network only; `cap_drop: ALL` |
| `redis` | Cache | Internal network; 128MB max memory LRU |

**Networks:**

- `public` — app exposed
- `runner_internal` — app ↔ runner only
- `cache_internal` — app ↔ redis only

### `Dockerfile.app`

- `node:20-alpine` + `python3`, `gcc`, `g++`, `openjdk17`
- Runs as `node` user
- CMD: `node server.js`

### `Dockerfile.runner`

- Same compilers
- Runs as UID `10001` (`runner` user)
- Minimal Express deps only

---

## 8. CI/CD

**`.github/workflows/deploy.yml`:**

1. Trigger: push/PR to `main`
2. `npm install && npm run build` in Frontend
3. `docker compose build` — validates images compile

Deploy step is commented (SSH to VPS template).

---

## 9. End-to-End Feature Flows

### 9.1 User registers and opens IDE

```
LandingPage → AuthDialog → POST /api/auth/register
  → { token, user } → persistSession(localStorage)
  → setView('desktop') → click CodeNest icon
  → setView('dashboard') → useProjectStore loads GET /api/projects
```

### 9.2 User runs JavaScript code

```
EditorPanel Run → App.runCode → POST /api/code/run
  → Backend axios → Runner POST /run
  → spawn node index.js in temp dir
  → { output, stderr, exitCode } → TerminalPanel
  → detectErrors → maybe show Debug button
```

### 9.3 Live AI hints while typing

```
Toggle Live AI → showLivePanel=true
  → useEffect on [code, language] with 2s debounce
  → POST /api/ai/live-check
  → ai.services.liveCheck → Groq JSON mode
  → LiveHintsPanel renders warnings/suggestions
```

### 9.4 AI auto-fix after error

```
Terminal shows error → Debug with AI → DebugPanel
  → handleAutoFix → POST /api/ai/debug-fix
  → parseModelJson → setCode(fixedCode)
  → saveSnapshot('Before AI fix')
```

### 9.5 Download project as ZIP

```
ProjectSidebar Download → GET /projects/:id/download (blob)
  → archiver streams from MongoDB embedded files
  → browser creates <a download>
```

---

## 10. API Reference

Base URL: `/api` (or full URL in production)

| Method | Endpoint | Auth | Body | Response |
|--------|----------|------|------|----------|
| POST | `/auth/register` | No | `{ email, password, name? }` | `{ token, user }` & cookie |
| POST | `/auth/login` | No | `{ email, password }` | `{ token, user }` & cookie |
| POST | `/auth/logout` | No | — | `{ success: true }` & clear cookie |
| GET | `/auth/me` | Yes | — | `{ user }` |
| GET | `/projects` | If configured | — | `{ projects: [...] }` |
| POST | `/projects` | If configured | `{ name }` | project object |
| PATCH | `/projects/:id` | If configured | `{ name }` | project object |
| POST | `/projects/:id/files` | If configured | `{ name, content }` | file object |
| PATCH | `/projects/:id/files/:fileId` | If configured | `{ name }` | file object |
| DELETE | `/projects/:id/files/:fileId` | If configured | — | `{ success: true }` |
| DELETE | `/projects/:id` | If configured | — | `{ success: true }` |
| GET | `/projects/:id/download` | If configured | — | ZIP binary |
| POST | `/ai/get-review` | If configured | `{ code }` | markdown string |
| POST | `/ai/edit-code` | If configured | `{ prompt, code }` | code string |
| POST | `/ai/live-check` | If configured | `{ code, language }` | JSON hints |
| POST | `/ai/explain-diff` | If configured | `{ oldCode, newCode }` | `{ explanation }` |
| POST | `/ai/debug-fix` | If configured | `{ code, errorOutput, language }` | JSON fix |
| POST | `/ai/visualize` | If configured | `{ code, language }` | `{ diagram }` |
| POST | `/code/run` | If configured | `{ code, language }` | execution result |
| GET | `/health` | No | — | status object |
| GET | `/metrics` | No | — | metrics object |

---

## 11. Environment Variables

### Backend

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `production` enables multi-worker cluster |
| `CLUSTER_WORKERS` | Override CPU worker count |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | HMAC signing secret |
| `JWT_TTL_SECONDS` | Token lifetime (default 7d) |
| `AUTH_REQUIRED` | `false` to allow guest access |
| `GROQ_API_KEY` | Groq API key |
| `REDIS_URL` | Redis connection (optional) |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `RUNNER_URL` | Runner service URL (default `http://runner:3001`) |
| `ALLOW_LOCAL_EXECUTION_FALLBACK` | `true` to run code on app host if runner fails |
| `MAX_CODE_BYTES`, `MAX_PROMPT_BYTES`, etc. | Payload limits |
| `AI_RATE_LIMIT`, `EXEC_RATE_LIMIT`, `PROJECT_RATE_LIMIT` | Rate limit counts |
| `PROJECT_LIST_CACHE_TTL` | Redis TTL for project lists |

### Frontend

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Production API base |
| `VITE_API_PROXY_TARGET` | Dev proxy target (default localhost:3000) |

### Runner

| Variable | Purpose |
|----------|---------|
| `RUNNER_PORT` | Default 3001 |
| `RUNNER_TIMEOUT_MS` | Execution timeout (5000) |
| `RUNNER_MAX_CONCURRENT` | Parallel executions (2) |
| `RUNNER_MAX_QUEUE_SIZE` | Queue cap (25) |

---

## 12. Security Model

| Threat | Defense |
|--------|---------|
| Stolen passwords | bcrypt salt generation + secure compare |
| Token tampering | HMAC-SHA256 verification |
| Huge request bodies | `Buffer.byteLength` limits + Express JSON cap |
| API abuse | Redis/in-memory rate limiting |
| Path traversal in filenames | Reject `..`, `/`, `\` |
| Arbitrary code on server | Isolated Runner container, no public port, timeouts |
| Runner compromise | Internal network only, dropped capabilities, read-only FS |
| XSS in AI markdown | React escapes by default; review uses markdown renderer |
| Secrets in git | `.env` not committed |

---

## 13. Interview Q&A (With Answers)

### Architecture

**Q: Walk me through the architecture.**  
**A:** React SPA talks to an Express API clustered for throughput. MongoDB stores users and projects with embedded files. Redis caches project lists and backs rate limiting with in-memory fallback. Untrusted code runs in a separate Runner microservice on an internal Docker network. AI features use Groq's LLM with caching, retries, and strict JSON parsing.

**Q: How is the backend organized for production readiness?**  
**A:** The backend is fully modularized following separation of concerns:
- **`app.js`** is the bootstrapper that configures global middleware, connects to DB, and mounts routes.
- **`db/db.js`** connects to MongoDB.
- **`middleware/`** contains decoupled modules for auth verification, rate limiting, request logging, and payload validation.
- **`routes/`** map endpoints to controllers and specify route-level middlewares.
- **`controllers/`** handle Express req/res logic and delegate to services.
- **`services/`** execute core business actions, database operations, and Groq LLM integrations.

**Q: Why embed files in the Project document?**  
**A:** IDE access patterns always need the full workspace. One read is faster than JOINing a files collection, and file count per project is bounded.

**Q: Why custom hooks instead of Redux?**  
**A:** State is scoped to workspace and versions. Hooks like `useProjectStore` encapsulate API + state without boilerplate. Redux would add ceremony for a medium-sized app.

### Performance

**Q: How do you avoid bankrupting the AI API?**  
**A:** Frontend debouncing (2s after typing stops), backend in-memory SHA256 cache (5 min TTL), Redis project list cache, and rate limiters per route category.

**Q: Why Node cluster?**  
**A:** Node is single-threaded; cluster uses all CPU cores and respawns crashed workers for availability.

### Security

**Q: How do you safely execute user code?**  
**A:** Dedicated Runner container: no public port, concurrency limits, 5s SIGKILL timeout, temp directories destroyed after run. Main API never executes code unless explicit dev fallback flag is set.

**Q: How does authentication work?**  
**A:** Register/login hashes passwords using `bcrypt`. JWTs are signed using `jsonwebtoken`. On login/registration, a secure `httpOnly` cookie is set on the response (with fallback to Bearer header authorization). The auth middleware reads this cookie, verifies the signature, and hydrates the user from MongoDB by `sub` claim.

### Frontend

**Q: How does syntax highlighting work?**  
**A:** `react-simple-code-editor` overlays Prism-highlighted HTML on a textarea. Each keystroke re-highlights using the active language grammar.

**Q: What is optimistic UI?**  
**A:** `updateFileContent` updates React state immediately so the UI feels instant, then persists to the API asynchronously.

**Q: How does version history work?**  
**A:** Snapshots stored in `localStorage` (max 50). `DiffViewer` uses LCS for side-by-side diff. AI explain calls `explainDiff` with old and new code.

### DevOps

**Q: How is this deployed?**  
**A:** Docker Compose runs app, runner, and redis on isolated networks. GitHub Actions builds the frontend and validates Docker images on every PR to main.

---

## Quick Revision Checklist

Before your interview, you should be able to explain:

- [ ] Cluster module in `server.js`
- [ ] Modular production architecture (Routes ➔ Controllers ➔ Services)
- [ ] Database connection module (`db.js`)
- [ ] Rate limiter Redis + Map fallback
- [ ] Document embedding in `Project.js`
- [ ] bcrypt + jsonwebtoken library
- [ ] Cookie-based session handling with `cookie-parser`
- [ ] `withCache` and `generateWithRetry` in AI service
- [ ] `extractFirstJsonObject` why it exists
- [ ] Runner queue + timeout + concurrency
- [ ] App.jsx view state machine + debouncing
- [ ] `useProjectStore` vs `useVersionStore`
- [ ] Mermaid + zoom/pan in ReviewPanel
- [ ] LCS diff in DiffViewer
- [ ] Docker network isolation for runner

---

*Good luck with your interview. You built a production-minded full-stack system — own every layer.*
