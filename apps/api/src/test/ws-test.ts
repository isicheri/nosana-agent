import { WebSocket } from "ws";

const sessionId = '3c8c42eb-5821-4a10-b722-f26532068a76';
const clientId = 'test-client-1';

let retryCount = 0;

function connect() {
  const socket = new WebSocket('ws://localhost:8080/ws');

  socket.on('open', () => {
    console.log('✅ WebSocket connection opened');
    retryCount = 0;

    // Initialize connection with session and client info
    socket.send(JSON.stringify({
      type: 'init',
      sessionId,
      clientId,
    }));
  });

  socket.on('message', (data: any) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.event) {
        case 'summarize:start':
          console.log('🔄 Summarization started');
          break;
        case 'summarize:done':
          console.log('✅ Summarization complete:', msg.data.result);
          break;
        case 'summarize:error':
          console.error('❌ Summarization error:', msg.data.error);
          break;
        default:
          // You can ignore unknown events or log them during development
          console.warn('⚠️ Unknown event:', msg.event);
      }
    } catch (err) {
      console.error('💥 Invalid message received:', data);
    }
  });

  socket.on('error', (err: any) => {
    console.error('❌ WebSocket error:', err);
  });

  socket.on('close', () => {
    retryCount++;
    const delay = Math.min(10000, 1000 * retryCount);
    console.warn(`⚠️ Disconnected. Reconnecting in ${delay / 1000}s...`);
    setTimeout(connect, delay);
  });
}

connect();