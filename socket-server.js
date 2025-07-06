// Simple Socket.IO server for Rock Paper Scissors multiplayer
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer((req, res) => {
  // Health check endpoint for Render
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'Rock Paper Scissors Socket.IO Server is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Handle other HTTP requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for internet access
    methods: ['GET', 'POST'],
    credentials: true
  },
});

const PORT = process.env.PORT || 3001;

const rooms = {}; // { roomId: { players: [socketId, ...], moves: { socketId: move } } }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], moves: {} };
    }
    if (rooms[roomId].players.length >= 2) {
      socket.emit('room_full');
      return;
    }
    rooms[roomId].players.push(socket.id);
    socket.join(roomId);
    io.to(roomId).emit('player_update', rooms[roomId].players.length);
    if (rooms[roomId].players.length === 2) {
      io.to(roomId).emit('both_joined');
    }
  });

  socket.on('make_move', ({ roomId, move }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].moves[socket.id] = move;
    socket.to(roomId).emit('opponent_moved');
    
    // Check if both players have moved
    if (Object.keys(rooms[roomId].moves).length === 2) {
      const moves = rooms[roomId].moves;
      const playerIds = Object.keys(moves);
      const move1 = moves[playerIds[0]];
      const move2 = moves[playerIds[1]];
      
      let result = 'tie';
      if (move1 !== move2) {
        if ((move1 === 'rock' && move2 === 'scissors') ||
            (move1 === 'paper' && move2 === 'rock') ||
            (move1 === 'scissors' && move2 === 'paper')) {
          result = 'p1';
        } else {
          result = 'p2';
        }
      }
      
      io.to(roomId).emit('round_result', { moves, result });
      rooms[roomId].moves = {}; // Reset for next round
    }
  });

  socket.on('leave_room', (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
      io.to(roomId).emit('player_update', rooms[roomId].players.length);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      }
    }
    socket.leave(roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up rooms when players disconnect
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex > -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit('player_update', room.players.length);
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Server URL: ${process.env.NODE_ENV === 'production' ? 'https://your-app-name.herokuapp.com' : `http://localhost:${PORT}`}`);
}); 