import  {WebSocket} from "ws";

// Replace with a real sessionId from your DB
const sessionId = '3c8c42eb-5821-4a10-b722-f26532068a76'; 
const clientId = 'test-client-1';

let retryCount = 0;

function connect() {

  const socket = new WebSocket('ws://localhost:4000/ws');

socket.on('open', () => {
  console.log('✅ WebSocket connection opened');

  retryCount = 0;

  // Send init message
  socket.send(JSON.stringify({
    type: 'init',
    sessionId,
    clientId,
  }));
});

socket.on('message', (data:any) => {
  const msg = JSON.parse(data);
  console.log('📡 Message received:', msg);

  if (msg.event === 'resource:uploaded') {
    console.log('✅ Upload event received:', msg.data);
  }
});

socket.on('error', (err:any) => {
  console.error('❌ WebSocket error:', err);
});



socket.on('close', () => {
   retryCount++;
    const delay = Math.min(10000, 1000 * retryCount); // Cap at 10s
    console.warn(`⚠️ Disconnected. Reconnecting in ${delay / 1000}s...`);
    setTimeout(connect, delay);
});

}


connect();