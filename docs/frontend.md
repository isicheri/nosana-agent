# Frontend.md — AI Study Assistant (Frontend Guide)

> **Project:** AI Study Assistant — Nosana Builders Challenge 3  
> **Audience:** Frontend developers  
> **Purpose:** Explain how the backend works, what endpoints are available, and how the frontend should interact with the system.

---

## 1. Overview

This frontend powers the user experience for the AI Study Assistant. Users upload course materials (PDF/text), receive summaries and flashcards, and ask questions about the content. The backend handles all AI logic — your job is to build a clean, responsive UI that interacts with it via REST and WebSockets.

---

## 2. System Diagram (Frontend Perspective)

---

## 3. Key Flows

### 📄 Upload & Summarize
- User uploads a PDF or text file.
- Frontend sends `POST /api/upload` with the file.
- Backend extracts text, stores it, and triggers summarization.
- WebSocket emits `summary:started`, `summary:progress`, `summary:done`.

### 💬 Ask Questions
- User types a question.
- Frontend sends `POST /api/ask` with `sessionId` and `question`.
- Backend returns an answer and emits `message:new`.

### 🧠 Flashcards
- User clicks “Generate Flashcards”.
- Frontend sends `POST /api/flashcards` with `summaryId`.
- Backend returns flashcards and emits `flashcards:new`.

---

## 4. API Endpoints

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/upload` | `POST` | Upload file and start summarization |
| `/api/ask` | `POST` | Ask a question about uploaded content |
| `/api/flashcards` | `POST` | Generate flashcards from a summary |
| `/api/session/:id` | `GET` | Fetch session metadata, summaries, flashcards, chat history |

---

## 5. WebSocket Events

Use Socket.IO to subscribe to real-time updates:

| Event | Payload |
|-------|---------|
| `summary:started` | `{ sessionId, resourceId }` |
| `summary:progress` | `{ percent, sessionId }` |
| `summary:done` | `{ summary, sessionId }` |
| `flashcards:new` | `{ flashcards, sessionId }` |
| `message:new` | `{ message, sessionId }` |
| `resource:uploaded` | `{ resourceId, sessionId }` |

---

## 6. Suggested UI Pages

- **Home / Upload Page** — Upload file, show progress, start session.
- **Study Dashboard** — View summary, flashcards, and ask questions.
- **Chat Interface** — Show Q&A history with citations.
- **Session Viewer** — Load past sessions via `GET /api/session/:id`.

---

## 7. Frontend Stack Suggestions

- **Framework:** Next.js (recommended)
- **State Management:** React Context or Zustand
- **WebSocket Client:** Socket.IO-client
- **Styling:** TailwindCSS or Chakra UI
- **PDF Parsing (optional):** Use backend for parsing, but preview PDF client-side if needed.

---

## 8. Dev Tips

- Use optimistic UI updates for uploads and flashcard generation.
- Show loading indicators for summarization and QA latency.
- Display citations and provenance clearly in answers.
- Handle file size limits (max 10–20MB) and error states gracefully.

---

## 9. Next Steps

1. Scaffold Next.js app with upload and dashboard pages.
2. Connect to backend API and WebSocket.
3. Build flows: Upload → Summary → Flashcards → Q&A.
4. Add session viewer and chat history.
5. Polish UI and test with sample documents.
