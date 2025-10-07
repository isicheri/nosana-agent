import  {WebSocket} from "ws";

// Replace with a real sessionId from your DB
const sessionId = '9f1bfb8f-9de8-4383-a481-dd9434bc6e48'; 
const clientId = 'test-client-1';

function connect() {

  const socket = new WebSocket('ws://localhost:4000/ws');

socket.on('open', () => {
  console.log('✅ WebSocket connection opened');

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
  console.log('🔌 WebSocket connection closed');
  setTimeout(connect,3000)
});

}
