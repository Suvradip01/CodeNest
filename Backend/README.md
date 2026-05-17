# CodeNest Backend - Detailed Architecture & Implementation Guide

Welcome to the comprehensive guide for the **CodeNest Backend**. This document is designed to give you complete control over your project, explaining not just *what* the code does, but *why* it was built this way and *how* it works under the hood. It serves as perfect preparation for interviews or onboarding.

---

## 🚀 1. Project Overview
**CodeNest** is an AI-augmented cloud IDE. The backend is a robust Node.js/Express application that powers the core features of the IDE:
- **Authentication:** Custom JWT-based user authentication.
- **Project & File Management:** Storing and organizing user code in MongoDB.
- **AI Features:** Code review, live linting, debug fixing, diff explanation, and visual diagram generation using Groq's LLM API.
- **Code Execution:** Compiling and running user code (JS, Python, Java, C) securely.

### Core Tech Stack
- **Framework:** Node.js with Express.js
- **Database:** MongoDB (via Mongoose)
- **Caching & Rate Limiting:** Redis (with in-memory fallback)
- **AI Integration:** Groq SDK (`llama-3.3-70b-versatile`)
- **Scaling:** Node `cluster` module
- **Utilities:** `archiver` (for zipping projects), `crypto` (for hashing/JWT)

---

## 📁 2. Folder Structure & Breakdown

Here is how the project is organized. Each layer has a specific responsibility (following the separation of concerns principle):

```text
Backend/
├── server.js              # Application entry point & Cluster manager
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (git-ignored)
└── src/                   # Core application source code
    ├── app.js             # Express app setup, rate-limiting, request routing
    ├── models/            # Mongoose database schemas
    ├── routes/            # API Route definitions (Endpoints)
    ├── controllers/       # (Optional) Route handlers logic
    ├── services/          # Core Business Logic (DB calls, external APIs)
    ├── middleware/        # Express Middlewares (Auth checking)
    └── cache/             # Redis integration
```

---

## 🔍 3. Detailed Component Breakdown

### 3.1 The Entry Point: `server.js`
**How it works:** 
It uses Node's built-in `cluster` module. In production, it checks how many CPU cores you have and forks a worker process for each core. In development, it runs a single worker.
**Why:** Node.js is single-threaded. By using clusters, you can handle multiple concurrent requests simultaneously, maximizing server hardware utilization. It also auto-respawns workers if they crash, ensuring high availability.

### 3.2 The Core Application: `src/app.js`
**How it works:**
- **Rate Limiting:** Implements a custom rate limiter (`createRateLimiter`). It tries to use Redis first. If Redis is down, it gracefully falls back to an in-memory `Map` to track request counts per IP/User. There are separate limits for AI, Execution, and Projects.
- **Payload Limits:** Custom middleware `ensureTextPayloadWithinLimit` protects against heavy payloads (e.g., stopping massive code files from crashing the server).
- **Code Execution Fallback (`/api/code/run`):** It tries to send code to an external runner service (`http://runner:3001`). If that fails, it has a built-in local fallback that uses `child_process.spawn` to write the code to a temporary directory, compile it (for Java/C), and run it locally with a timeout.
**Why:** The rate limiter and payload limits protect the server from DDoS attacks and abusive users. The execution fallback ensures the IDE remains functional even if the isolated runner microservice goes down.

### 3.3 Database Models: `src/models/`
- **`User.js`**: Stores user credentials. It saves a `passwordHash` rather than raw passwords.
- **`Project.js`**: Represents a user's coding workspace. Instead of a separate `File` collection, files are stored as an array of embedded documents inside the Project schema (`files: [fileSchema]`).
**Why Embedded Files?** Since a project typically has a bounded, small number of files in a web IDE, embedding them in the project document makes fetching an entire project a single, lightning-fast database read rather than requiring complex joins or multiple queries.

### 3.4 Business Logic: `src/services/`
The services layer isolates complex logic from the API routes.
- **`auth.services.js`**: 
  - **Hashing:** Uses Node's native `crypto.scrypt` with random salts to securely hash passwords.
  - **JWT:** Implements custom JWT generation (`signToken`) and verification (`verifyToken`) using `crypto.createHmac`.
  - **Why:** Hand-rolling JWT/Scrypt (instead of using `bcrypt` or `jsonwebtoken` libraries) minimizes dependencies and demonstrates a deep understanding of cryptography.
- **`project.services.js`**: 
  - Handles CRUD operations for projects/files. 
  - Validates constraints (max file name length, max files per project).
  - Uses `archiver` to generate ZIP files of projects dynamically for download.
  - Caches project lists in Redis (`cacheGet`, `cacheSet`) and invalidates the cache on writes (`bustListCache`).
- **`ai.services.js`**: 
  - Connects to Groq to leverage LLMs for code operations.
  - **Caching:** Implements an in-memory `Map` cache (keyed by payload hash) to instantly return results for identical AI requests, saving API costs and reducing latency.
  - **Retry Logic:** `generateWithRetry` handles 429 (Rate Limit) and 503 (Unavailable) errors with exponential backoff.
  - **JSON Parsing:** Robustly extracts JSON from LLM outputs using `extractFirstJsonObject` because LLMs sometimes wrap JSON in markdown (e.g., ````json { ... } ````).

### 3.5 API Routes: `src/routes/`
- **`auth.routes.js`**: `/register`, `/login`, `/me`.
- **`project.routes.js`**: RESTful endpoints (`GET /`, `POST /`, `POST /:projectName/files`, `DELETE /:projectName/files/:fileName`, `GET /:projectName/download`).
- **`ai.routes.js`**: Defines the endpoints for AI features. Notice how error handling checks for specific AI status codes to return user-friendly error messages (e.g., "AI temporarily unavailable").

### 3.6 Caching Layer: `src/cache/redis.js`
**How it works:** A singleton wrapper around the `redis` client. It connects on startup but is designed to be fault-tolerant. If `REDIS_URL` is missing or Redis crashes, `connected` becomes false, and the wrapper functions gracefully return `null` instead of throwing errors.
**Why:** This prevents the entire application from crashing if the Redis cache server goes down.

### 3.7 Middleware: `src/middleware/auth.js`
**How it works:** Extracts the Bearer token, verifies it, fetches the user from MongoDB, and attaches `req.user`. It includes an `optionalAuth` middleware and a `requireAuthIfConfigured` wrapper.
**Why:** This allows the application to run in a "guest mode" if `AUTH_REQUIRED=false` is set in the environment, making it easier to test locally without logging in.

---

## 🛠️ 4. Interview Preparation: Potential Questions & Answers

### Q: Why did you separate `routes`, `controllers`, and `services`?
**A:** "To maintain a clean architecture and separation of concerns. Routes define *where* requests go. Controllers (or route handlers) extract data from the HTTP request and format the response. Services contain the actual *business logic*. This makes the business logic reusable (e.g., I can call a service from a CLI tool or a test script without mocking HTTP requests) and keeps the code highly testable."

### Q: How does your application handle high traffic?
**A:** "In several ways:
1. **Clustering:** I use Node's `cluster` module to run multiple processes, utilizing all CPU cores.
2. **Caching:** Expensive operations, like fetching project lists and AI LLM generations, are cached (Redis for DB, in-memory for AI).
3. **Rate Limiting:** I built a sliding window rate limiter backed by Redis to prevent abuse, with an in-memory fallback to ensure availability if Redis fails."

### Q: How do you handle Code Execution securely?
**A:** "Executing user code is inherently risky. The primary architecture delegates this to an isolated runner service. However, if that service fails, my backend has a fallback using `child_process.spawn`. It writes the code to a temporary directory in the OS temp folder, compiles it, and runs it with a strict timeout (e.g., 5000ms) to prevent infinite loops from locking up the server."

### Q: How did you implement Authentication?
**A:** "I implemented a stateless JWT (JSON Web Token) authentication system. For password hashing, I used Node's native `crypto.scrypt` with a random salt. For the tokens, I manually built the base64url encoding and HMAC-SHA256 signature logic to verify the integrity of the payload. I store the token on the client and pass it via the `Authorization: Bearer` header."

### Q: What challenges did you face integrating the AI (Groq)?
**A:** "LLMs are non-deterministic and APIs can be flaky. I solved three main issues:
1. **Rate Limits & Downtime:** I implemented an exponential backoff retry mechanism.
2. **Latency & Cost:** I added an LRU-style in-memory cache hashing the prompts, so identical requests resolve instantly.
3. **Formatting:** LLMs often wrap JSON in markdown blocks. I wrote a robust parser (`extractFirstJsonObject`) that scans the string to extract the raw JSON object safely."

---

## 🚀 5. How to Run & Test
1. Make sure MongoDB and Redis (optional) are running.
2. `npm install`
3. Create a `.env` file with `MONGODB_URI`, `JWT_SECRET`, `GROQ_API_KEY`.
4. Run `npm start` (Runs in cluster mode) or `node server.js`.
