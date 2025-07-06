// Simple test script to verify Socket.IO server
const io = require('socket.io-client');

// Replace with your deployed server URL
const SERVER_URL = 'http://localhost:3001'; // Change to your deployed URL

console.log('Testing connection to:', SERVER_URL);

const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Connected to server!');
  console.log('Socket ID:', socket.id);
  
  // Test joining a room
  const testRoomId = 'test-room-' + Date.now();
  socket.emit('join_room', testRoomId);
  console.log('Joining room:', testRoomId);
});

socket.on('player_update', (count) => {
  console.log('👥 Players in room:', count);
});

socket.on('both_joined', () => {
  console.log('🎮 Both players joined!');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
});

// Disconnect after 5 seconds
setTimeout(() => {
  console.log('Test completed');
  socket.disconnect();
  process.exit(0);
}, 5000); 