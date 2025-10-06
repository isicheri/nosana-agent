# Architecture.md — AI Study Assistant (Backend)

> **Project:** AI Study Assistant — Nosana Builders Challenge 3 (Agents 102)
> 
> **Scope:** Backend-focused architecture describing how MCP server, Mastra agent, session management, and Nosana deployment fit together. This is meant to be dropped into `/docs/Architecture.md` in your repo.

---

## 1. High-level overview

This backend powers the AI Study Assistant: users upload course materials (PDF/text) which the MCP server ingests and exposes through MCP tools (e.g. `summarize`, `qa`, `flashcards`). A Mastra agent orchestrates tool calls, maintains session context, and exposes a lightweight HTTP API consumed by the Next.js frontend. The backend is containerized and deployed to the Nosana Network to satisfy the challenge production/decentralization requirement.


## 2. System diagram (text)

```
[Frontend: Next.js]  <---- websocket/REST ---->  [Backend API (Express/Nest)]
                                               |
                                               | (invokes)
                                               v
                                         [Mastra Agent]
                                               |
                                               | (calls MCP tools via)
                                               v
                                         [MCP Server]
                       (Resources: uploaded files, parsed text, embeddings)

Deployment:
 - Backend + MCP Server -> Docker -> Nosana Network
 - Frontend -> Vercel
```


## 3. Components & responsibilities

### 3.1 MCP Server
- Implements Model Context Protocol to manage **resources**, **tools**, and **prompts**.
- Hosts custom MCP tools (at least 3):
  - `summarize` — accepts a resource (text or parsed PDF) and returns structured summary (sections, bullet points, TL;DR, suggested study questions).
  - `qa` — accepts a question and relevant resource context (or context ID) and returns a context-aware answer with citations back to resource chunks.
  - `flashcards` — generates flashcards (Q&A pairs) from the summary for revision and self-testing.
- Optional extra tools: `outlineToSlides`, `generateQuiz`.
- Stores resources (raw text, tokenized chunks, embeddings) and exposes metadata used by Mastra.

**Tool Contracts** (example)
- `summarize(resource_id, options) -> {summary_id, outline[], tl_dr, sections[]}`
- `qa(resource_ids[], question, session_id) -> {answer, sources[], provenance[]}`
- `flashcards(summary_id, options) -> {flashcards: [{question, answer}]}`


### 3.2 Mastra Agent
- Orchestrates tool calls and maintains **session-level state** (what was uploaded, last summary, chat history).
- Implements dynamic prompts and templates using template variables (e.g. `{{last_summary}}`, `{{user_question}}`).
- Exposes an interface for the backend API (synchronous HTTP + optional websocket events for live sync).
- Handles multi-step flows: (Upload → Summarize → Flashcards → Answer follow-ups) and context windows.


### 3.3 Backend API (your area of work)
- Lightweight Node.js server (Express or NestJS). Responsibilities:
  - Authentication & lightweight rate-limit (for challenge, basic API key or JWT).
  - File upload endpoint (accept PDF, extract text via `pdf2json` or similar, store resource in MCP).
  - Endpoints that invoke Mastra flows:
    - `POST /api/upload` — upload and start summarization.
    - `POST /api/ask` — submit question, returns answer and updated session state.
    - `POST /api/flashcards` — generate flashcards from a summary.
    - `GET  /api/session/:id` — get session metadata, summaries, flashcards, and message history.
  - Expose websocket (Socket.IO) or SSE for live synchronization: frontend subscribes to session updates.


## 4. Data models (suggested)

- **Session**
  - `id`, `userId` (optional), `resources: [resourceId]`, `createdAt`, `updatedAt`, `history: [Message]`
- **Resource**
  - `id`, `filename`, `text`, `chunks[]`, `embeddingsStoreId`, `uploadedAt`
- **Summary**
  - `id`, `resourceId`, `outline`, `sections[]`, `generatedAt`, `metadata`
- **FlashcardSet**
  - `id`, `summaryId`, `cards: [{question, answer}]`, `generatedAt`
- **Message** (chat history)
  - `id`, `sessionId`, `role` (`user`/`agent`), `text`, `attachments?`, `createdAt`

Persist these in a lightweight DB (SQLite/Postgres). For the challenge Postgres is preferable to show production readiness.


## 5. APIs (detailed)

### `POST /api/upload`
- Accepts: multipart/form-data { file: PDF|txt, sessionId? }
- Flow:
  1. Save file to storage (local or cloud).  
  2. Extract text, chunk it, create resource record.  
  3. Store resource in MCP server (create MCP resource pointer).  
  4. Trigger Mastra agent to call `summarize(resourceId)`.
- Returns: `{ sessionId, resourceId, jobId }` and triggers websocket event `summary:started`.


### `POST /api/ask`
- Accepts: `{ sessionId, question }`
- Flow:
  1. Agent resolves which resources are relevant (via embeddings / simple keyword matching).
  2. Agent calls MCP `qa` with chosen context and session metadata.
  3. Return answer; append to session history; emit `message:new`.
- Returns: `{ answer, sources, sessionState }`


### `POST /api/flashcards`
- Accepts: `{ sessionId, summaryId }`
- Flow:
  1. Agent calls MCP `flashcards` with the summary ID.
  2. Stores flashcard set in DB.
  3. Emits websocket event `flashcards:new`.
- Returns: `{ flashcards, sessionState }`


### `GET /api/session/:id`
- Returns session metadata, summaries, flashcards, and chat history.


## 6. Live sync / Real-time
- Use Socket.IO (or WebSockets) for: job updates, new messages, progress from MCP tools.
- Events:
  - `summary:started`, `summary:progress`, `summary:done`
  - `flashcards:new`
  - `message:new`
  - `resource:uploaded`

Frontend listens and updates UI instantly.


## 7. Deployment (Nosana)
- Containerize MCP Server + Mastra agent + Backend API. You can either:
  - Combine them in a single service (monolith container) for the challenge, or
  - Split into two containers: `mcp-server` and `api-agent` (recommended for clarity).
- Provide Dockerfile for each service and a `nosana.yaml` (or required manifest) to run on the Nosana network.
- Use health checks and concurrency hints so judges can run it easily.

**Example Dockerfile (backend)**
```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "dist/main.js"]
```


## 8. Testing & verification
- Unit tests for tool wrappers (mock MCP responses).
- Integration tests for upload → summarize → flashcards → ask flow.
- E2E: Use a small test document and assert summary existence, flashcards generated, and QA correctness.


## 9. Observability & Metrics
- Basic logs (structured JSON).  
- Instrument these metrics:
  - Number of resources processed, time-per-summarize, avg QA latency, flashcards generated.  
- For challenge: console logs + an endpoint `GET /health` and `GET /metrics` are adequate.


## 10. Security & Cost controls
- Limit file size (e.g., max 10–20MB) and rate-limit endpoints.
- Sanitize extracted text before passing to models.
- Implement optional retention policy for resources to control cost (e.g., auto-delete after 7 days unless user saves).


## 11. Folder structure (suggested)

```
backend/
 ├── packages/
 │   ├── mcp-server/         # MCP implementation + tools
 │   ├── mastra-agent/       # Agent logic + prompt templates
 │   └── api/                # Express or Nest app (HTTP + websockets)
 ├── docker/                 # Docker compose / manifests for local dev
 ├── scripts/                # helper scripts (seed, tests)
 └── docs/
     └── Architecture.md
```


## 12. Checklist for challenge submission
- [ ] Forked & extended workshop template
- [ ] Implemented at least 3 custom MCP tools (`summarize`, `qa`, `flashcards`)
- [ ] Dynamic prompts & Mastra agent orchestration
- [ ] Responsive frontend + live sync (frontend stub acceptable but show flows)
- [ ] Deployed backend on Nosana (docker + manifest)
- [ ] Documentation: this Architecture.md + README + deployment notes


## 13. Next steps (backend-first)
1. Scaffold repo with monorepo packages (`api`, `mcp-server`, `mastra-agent`).
2. Implement `summarize` MCP tool (simple LLM prompt → structured JSON).
3. Implement `qa` MCP tool with context window and simple citation logic.
4. Implement `flashcards` MCP tool to generate Q&A pairs from summary.
5. Wire Mastra agent to call tools and persist session state.
6. Add `POST /api/upload`, `POST /api/ask`, and `POST /api/flashcards` endpoints and websocket events.
7. Containerize and prepare Nosana manifest; run local end-to-end tests.

---

