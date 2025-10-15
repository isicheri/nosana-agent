import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import http from "http";
import {WebSocketServer} from "ws";
import { rateLimit } from "express-rate-limit";
import { OutputPayloadSchema, summarizeInputSchema, chatInputSchema, flashcardInputSchema, FlashcardsOutputSchema } from "./types";
import {mastra} from "./mastra/index"
import { sendEventToSession, setupWebsocket } from "./wss/websocket";
import { globalErrorHandler } from "./handlers/error/globalErrorHandler";
dotenv.config();
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({server,path: "/ws"})
setupWebsocket(wss)
app.use(express.json());
app.use(cors());

// Rate limiter: 15 requests per IP per day, reset at midnight
const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hrs
  max: 15,
  message: {
    error: 'Too many requests from this IP, please try again after 24 hours.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
//v2 features
// server.use('/pdfs', express.static(path.join(process.cwd(), 'src/server/pdfs')));
// server.post("/api/upload-pdf", (req, res, next) => {
//   multerUpload.single("pdf")(req, res, (err) => {
//     if (err) {
//       if (err instanceof multer.MulterError) {
//         return res.status(400).json({ error: err.message });
//       }
//       return res.status(500).json({ error: err.message });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     next();
//   });
// }, (req, res) => {
//   // Construct full file URL
   
//   if(!req.file) {

//   res.status(400).json({
//     message: "File not found",
//   });
//     return;
//   }

//   const fileUrl = `${req.protocol}://${req.get('host')}/pdfs/${req.file.filename}`;

//   res.status(200).json({
//     message: "File uploaded successfully",
//     fileUrl,  // <-- This is the public URL
//   });
// });

// app.post("/api/summarize", async (req, res) => {
//   const { style, content } = req.body;
//   const agent = mastra.getAgent("studyAssistantAgent");
//   try {
//     const result = await agent.generate(
//       `Summarize the following in a ${style} way:\n\n${content}`
//     );
//     res.json({ summary: result.text });
//   } catch (error) {
//     console.error("Summarize error:", error);
//     res.status(500).json({ error: "Summarization failed" });
//   }
// });


app.post("/api/summarize", async (req, res) => {
  const parsedBody = await summarizeInputSchema.safeParseAsync(req.body);
  // console.log("Parsed Body: ",parsedBody);
  if (!parsedBody.success) {
    const formattedErrors = parsedBody.error.issues.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    res.json({errorMessage: formattedErrors[0]?.message || 'Validation failed'})
    return;
  }
  const { style, content, sessionId } = parsedBody.data as { style: string, content: string, sessionId: string };

  // 1. Notify clients that summarization has started
  sendEventToSession(sessionId, "summarize:start", {
    message: "Summarization in progress...",
  });

  try {
    const agent = mastra.getAgent("studyAssistantAgent");
    // 2. Get result from agent
    const result = await agent.generate(
      `Summarize the following in a ${style} way:\n\n${content}`
    );
    // 3. Extract structuredContent
    const structuredContent = (
      ((result as any)?.steps?.[0]?.toolResults?.[0]?.payload?.result as any)?.structuredContent
    ) as unknown;
    // 4. Validate structuredContent format
    const parsed = OutputPayloadSchema.safeParse(structuredContent);
    if (!parsed.success) {
      console.error("Invalid structuredContent:", structuredContent);
      sendEventToSession(sessionId, "summarize:error", {
        error: "Unexpected result format",
      });
      return res.status(500).json({ error: "Unexpected response format." });
    }
    const { summary } = parsed.data;
    // 5. Send summary to client
    sendEventToSession(sessionId, "summarize:done", {
      result: summary,
    });
    res.json({ result: summary });
  } catch (error) {
    console.error("Summarize error:", error);
    sendEventToSession(sessionId, "summarize:error", {
      error: "Summarization failed. Please try again.",
    });
    res.status(500).json({ error: "Summarization failed." });
  }
});


app.post("/api/chat", async (req, res) => {
  const parsedBody = await chatInputSchema.safeParseAsync(req.body);
  if (!parsedBody.success) {
    const formattedErrors = parsedBody.error.issues.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    return res.status(400).json({ error: formattedErrors[0]?.message || 'Validation failed' });
  }

  const { message, sessionId } = parsedBody.data as { message: string, sessionId: string };

  // notify start
  sendEventToSession(sessionId, "chat:start", { message: "Processing chat..." });

  try {
    const agent = mastra.getAgent("studyAssistantAgent");
    const result = await agent.generate([
      {
        role: "system",
        content:
          "Answer the user's query directly. Provide content-only examples relevant to the user's topic. Do NOT mention, list, or demonstrate any tools or how to use them. Avoid meta responses about capabilities. Keep answers concise,detailed and useful.",
      },
      { role: "user", content: message },
    ]);

    const replyText = (result as any)?.text ?? "";

    sendEventToSession(sessionId, "chat:done", { result: replyText });
    res.json({ result: replyText });
  } catch (error) {
    console.error("Chat error:", error);
    sendEventToSession(sessionId, "chat:error", { error: "Chat failed. Please try again." });
    res.status(500).json({ error: "Chat failed." });
  }
})

app.post("/api/flashcard", async (req, res) => {
  const parsedBody = await flashcardInputSchema.safeParseAsync(req.body);
  if (!parsedBody.success) {
    const formattedErrors = parsedBody.error.issues.map((e) => ({
      field: e.path[0],
      message: e.message,
    }));
    return res.status(400).json({ error: formattedErrors[0]?.message || 'Validation failed' });
  }

  const { content, style, sessionId } = parsedBody.data as {
    content: string;
    style: string;
    sessionId: string;
  };

  sendEventToSession(sessionId, "flashcards:start", {
    message: "Generating flashcards...",
  });

  try {
    const agent = mastra.getAgent("studyAssistantAgent");
    const result = await agent.generate(
      `Create ${style} flashcards for the following content. Return JSON array of {question, answer}:
      
${content}`
    );

    const structured = (
      ((result as any)?.steps?.[0]?.toolResults?.[0]?.payload?.result as any)?.structuredContent
    ) as unknown;

    // Try structured output first
    const validated = FlashcardsOutputSchema.safeParse(structured);

    let flashcards: { question: string; answer: string }[] = [];

    if (validated.success) {
      flashcards = validated.data.flashcards || [];
    } else {
      // Fallback: try parse text as JSON array
      try {
        const rawText = (result as any)?.text ?? "";

        // Clean up markdown-style code blocks if present
        const cleaned = rawText
          .trim()
          .replace(/^```json/, "")
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim();

        const parsed = JSON.parse(cleaned);
        const arrayCheck = Array.isArray(parsed) ? parsed : [];

        flashcards = arrayCheck
          .filter((x) => x && typeof x === "object")
          .map((x) => ({
            question: String(x.question || ""),
            answer: String(x.answer || ""),
          }))
          .filter((x) => x.question && x.answer)
          .slice(0, 15);
      } catch {
        // Last resort: split lines into Q/A pairs
        const lines = String((result as any)?.text ?? "")
          .split("\n")
          .filter(Boolean);

        for (let i = 0; i < lines.length; i += 2) {
          flashcards.push({
            question: lines[i] || "Question missing",
            answer: lines[i + 1] || "Answer missing",
          });
        }
      }
    }

    sendEventToSession(sessionId, "flashcards:done", { result: flashcards });
    res.json({ result: flashcards });
  } catch (error) {
    console.error("Flashcards error:", error);
    sendEventToSession(sessionId, "flashcards:error", {
      error: "Flashcard generation failed. Please try again.",
    });
    res.status(500).json({ error: "Flashcard generation failed." });
  }
});



app.use(globalErrorHandler);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

