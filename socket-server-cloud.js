// Alternative Socket.IO server for cloud deployment
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Support both WebSocket and polling
});

const PORT = process.env.PORT || 3001;

const rooms = {};

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
      rooms[roomId].moves = {};
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
  console.log(`Server ready for cloud deployment`);
}); 