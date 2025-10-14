# Architecture.md — AI Study Assistant (Backend)

> **Project:** AI Study Assistant — Nosana Builders Challenge 3 (Agents 102)  
> **Focus:** Backend architecture for Mastra-based study assistant with tool orchestration, memory, and agent-driven flows.

---

## 1. High-Level Overview

This backend powers an interactive AI Study Assistant. Users paste or upload study materials (PDF/text). A **Mastra agent** coordinates summarization, Q&A, and flashcard generation using **MCP tools**, while maintaining memory of the session and learner profile.

The backend is containerized and deployed to the **Nosana Network**, while the frontend (Next.js) runs on Vercel.

---

## 2. System Diagram
[Frontend: Next.js]
       │
       │  (REST/WebSocket API)
       ▼
[Backend API (Express/NestJS)]
       │
       │  (Message delegation)
       ▼
   [Mastra Agent]
       │
       │  (Tool orchestration)
       ▼
   [MCP Server + Tools]
       ├── summarizeContentTool
       ├── generateFlashcardsTool
       └── chatWithResourceTool

Deployment:
 - Backend + Mastra Agent + MCP → Docker → Nosana Network
 - Frontend → Vercel or standalone deployment



---

## 3. Components

### 🧠 Mastra Agent

- Core study assistant logic.
- Built with `@mastra/core` + `@mastra/memory`.
- Uses Mistral model (`ministral-3b-latest`).
- Maintains persistent **user memory**:
  - Student name, learning goals, topics, history.
- Orchestrates tools based on intent:
  - Summarize → Offer flashcards → Support questions.
- Responds naturally with markdown formatting.

> ✅ Memory template includes profile, progress, last session  
> ✅ Remembers uploaded content and session state across messages

---

### 🛠️ MCP Tools

All tools are exposed via the Mastra MCP protocol and used by the agent:

#### `summarizeContentTool`

- **Inputs:**
  - `content: string` — text to summarize
  - `style: string` — "concise", "detailed", etc.
- **Output:**
  - `{ summary: string, style: string }`

#### `generateFlashcardsTool`

- **Inputs:**
  - `content: string` — source text (can be summary or raw)
  - `style: string` — "general", "exam", etc.
- **Output:**
  - `flashcards: Array<{question, answer}>`

#### `chatWithResourceTool`

- **Inputs:**
  - `question: string`
  - `messages: Array<{role, content}>` — conversation history
  - `resources: Array<{name, content}>` — uploaded or pasted text
- **Output:**
  - `answer: string`
  - `usedResources: string[]`

---

### 🌐 Backend API

Node.js server with the following responsibilities:

- Accept text or file uploads
- Expose endpoints that pass messages to Mastra agent
- Trigger tool-based workflows
- Maintain session state (optional DB)

**Endpoints**

- `POST /api/chat` — send a user message, agent returns reply
- `POST /api/flashcards` — generate flashcards from summary
- `GET /api/session/:id` — fetch chat history, summaries, flashcards

> Optionally includes WebSocket support for real-time updates

---

## 4. Data Flow: Example

```txt
User uploads PDF or pastes text →
→ Backend extracts raw text →
→ Mastra agent calls summarizeContentTool →
→ Returns summary →
→ Agent offers flashcards →
→ If user accepts, agent calls generateFlashcardsTool →
→ User asks follow-up → chatWithResourceTool
