import { WebSocket, WebSocketServer } from "ws";

// In-memory tracking
const clientsBySession = new Map<string, Map<string, WebSocket>>();
const sessionIdBySocket = new WeakMap<WebSocket, string>();
const clientIdBySocket = new WeakMap<WebSocket, string>();

export const setupWebsocket = (wss: WebSocketServer) => {
  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`🔌 Client connected: ${ip}`);

    let initialized = false;

    ws.on("message", (message) => {
      if (initialized) return; // Prevent double init

      try {
        const data = JSON.parse(message.toString());

        if (data.type === "init" && data.sessionId && data.clientId) {
          const { sessionId, clientId } = data;

          // Set up session map if needed
          if (!clientsBySession.has(sessionId)) {
            clientsBySession.set(sessionId, new Map());
          }

          const sessionClients = clientsBySession.get(sessionId)!;

          // Handle reconnection or duplicate clientId
          if (sessionClients.has(clientId)) {
            const existingSocket = sessionClients.get(clientId)!;
            existingSocket.send(JSON.stringify({
              error: "Another connection established. Closing this one.",
            }));
            existingSocket.close();
          }

          // Store mappings
          sessionClients.set(clientId, ws);
          sessionIdBySocket.set(ws, sessionId);
          clientIdBySocket.set(ws, clientId);

          initialized = true;

          // Confirm connection
          ws.send(JSON.stringify({
            type: "connected",
            sessionId,
            clientId,
            message: "WebSocket connected successfully.",
          }));
        } else {
          ws.send(JSON.stringify({ error: "Missing sessionId or clientId in init." }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ error: "Invalid message format." }));
      }
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected");

      const sessionId = sessionIdBySocket.get(ws);
      const clientId = clientIdBySocket.get(ws);

      if (sessionId && clientId) {
        const sessionClients = clientsBySession.get(sessionId);
        if (sessionClients) {
          sessionClients.delete(clientId);

          // Remove session if empty
          if (sessionClients.size === 0) {
            clientsBySession.delete(sessionId);
          }
        }
      }

      sessionIdBySocket.delete(ws);
      clientIdBySocket.delete(ws);
    });
  });
};

// Broadcast to all clients in a session
export const sendEventToSession = (
  sessionId: string,
  event: string,
  data: any
) => {
  const sessionClients = clientsBySession.get(sessionId);
  if (!sessionClients) return;

  const message = JSON.stringify({ event, data });

  console.log(`📢 Broadcasting [${event}] to session ${sessionId}`);

  for (const ws of sessionClients.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
};
