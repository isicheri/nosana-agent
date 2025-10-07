import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "@nosana-agent/db";

const clientsBySession = new Map<string, Map<string, WebSocket>>(); // sessionId -> clientId -> ws
const sessionIdBySocket = new WeakMap<WebSocket, string>();
const clientIdBySocket = new WeakMap<WebSocket, string>();

export const setupWebsocket = (wss: WebSocketServer) => {
  wss.on("connection", async (ws,req) => {
    let ip = req.socket.remoteAddress;
    console.log(`Client ${ip} connected`);

    let initialized = false;

    ws.on("message", async (message) => {
      if (initialized) return; // Prevent re-initialization

      try {
        const data = JSON.parse(message.toString());

        if (data.type === "init" && data.sessionId && data.clientId) {
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
            clientsBySession.set(data.sessionId, new Map());
          }
          const sessionClients = clientsBySession.get(data.sessionId)!;

          // If a client with this clientId already exists, close the old connection
          if (sessionClients.has(data.clientId)) {
            const oldWs = sessionClients.get(data.clientId)!;
            oldWs.send(JSON.stringify({ error: "Another connection established. Closing this one." }));
            oldWs.close();
          }

          sessionClients.set(data.clientId, ws);
          sessionIdBySocket.set(ws, data.sessionId);
          clientIdBySocket.set(ws, data.clientId);

          initialized = true;

          ws.send(
            JSON.stringify({ message: "Session connected", sessionId: data.sessionId, clientId: data.clientId })
          );
        } else {
          ws.send(JSON.stringify({ error: "Missing sessionId or clientId" }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      // Cleanup: remove ws from clientsBySession
      const sessionId = sessionIdBySocket.get(ws);
      const clientId = clientIdBySocket.get(ws);
      if (sessionId && clientId && clientsBySession.has(sessionId)) {
        const sessionClients = clientsBySession.get(sessionId)!;
        sessionClients.delete(clientId);

        if (sessionClients.size === 0) {
          clientsBySession.delete(sessionId);
        }
      }
      sessionIdBySocket.delete(ws);
      clientIdBySocket.delete(ws);
    });
  });
};

// Function to send event to clients in a session
export const sendEventToSession = (sessionId: string, event: string, data: any) => {
  if (!clientsBySession.has(sessionId)) return;

  const message = JSON.stringify({ event, data });

console.log(`📢 Sending [${event}] to session ${sessionId} →`, data);

  clientsBySession.get(sessionId)!.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
};

