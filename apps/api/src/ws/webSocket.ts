import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "@nosana-agent/db";

const clientsBySession = new Map<string, Set<WebSocket>>();
// Use a WeakMap to associate sessionId with each WebSocket
const sessionIdBySocket = new WeakMap<WebSocket, string>();

export const setupWebsocket = (wss: WebSocketServer) => {
  wss.on("connection", async (ws) => {
    console.log("Client connected");

    let initialized = false;

    ws.on("message", async (message) => {
      if (initialized) return; // Prevent re-initialization

      try {
        const data = JSON.parse(message.toString());

        if (data.type === "init" && data.sessionId) {
          // Validate session exists
          let session;
          try {
            session = await prisma.session.findUnique({
              where: { id: data.sessionId },
            });
          } catch (err) {
            ws.send(JSON.stringify({ error: "Database error" }));
            ws.close();
            return;
          }

          if (!session) {
            ws.send(JSON.stringify({ error: "Invalid sessionId" }));
            ws.close();
            return;
          }

          // Add ws to the clientsBySession map
          if (!clientsBySession.has(data.sessionId)) {
            clientsBySession.set(data.sessionId, new Set());
          }
          clientsBySession.get(data.sessionId)!.add(ws);
          sessionIdBySocket.set(ws, data.sessionId);

          initialized = true;

          ws.send(
            JSON.stringify({ message: "Session connected", sessionId: data.sessionId })
          );
        }
      } catch (e) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Cleanup: remove ws from clientsBySession
      const sessionId = sessionIdBySocket.get(ws);
      if (sessionId && clientsBySession.has(sessionId)) {
        clientsBySession.get(sessionId)!.delete(ws);

        if (clientsBySession.get(sessionId)!.size === 0) {
          clientsBySession.delete(sessionId);
        }
      }
      sessionIdBySocket.delete(ws);
    });
  });
};

// Function to send event to clients in a session
export const sendEventToSession = (sessionId: string, event: string, data: any) => {
  if (!clientsBySession.has(sessionId)) return;

  const message = JSON.stringify({ event, data });
  clientsBySession.get(sessionId)!.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};