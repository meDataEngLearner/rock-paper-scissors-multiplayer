// Simple Socket.IO server for Rock Paper Scissors multiplayer
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer((req, res) => {
  // Health check endpoint for Render
  if (req.url === '/health' || req.url === '/') {
    console.log(`[HTTP] Health check: ${req.url} from ${req.socket.remoteAddress}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      message: 'Rock Paper Scissors Socket.IO Server is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Log all other HTTP requests
  console.log(`[HTTP] 404 for ${req.url} from ${req.socket.remoteAddress}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for internet access
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;
console.log('[Server] Will listen on port:', PORT);

const rooms = {}; // { roomId: { players: [socketId, ...], moves: {}, createdAt: timestamp, joinTimeout: timeoutId } }
const JOIN_TIMEOUT = 60000; // 60 seconds to join room
const playerRooms = {}; // Track which room each player is in

// Helper to start move timeout for a room
function startMoveTimeout(roomId) {
  if (!rooms[roomId]) return;
  // Clear any existing timeout
  if (rooms[roomId].moveTimeout) {
    clearTimeout(rooms[roomId].moveTimeout);
  }
  rooms[roomId].moveTimeout = setTimeout(() => {
    if (!rooms[roomId]) return;
    if (Object.keys(rooms[roomId].moves).length < 2) {
      io.to(roomId).emit('opponent_timeout');
      rooms[roomId].moves = {};
      console.log(`[SOCKET] Emitting to room ${roomId}: opponent_timeout due to move timeout`);
    }
  }, 30000); // 30 seconds
}

io.on('connection', (socket) => {
  console.log('[SOCKET] New client connected:', socket.id, 'at', new Date().toISOString());
  socket.onAny((event, ...args) => {
    console.log(`[SOCKET] Event received: ${event} from ${socket.id} with payload:`, args);
  });
  
  socket.on('create_room', (roomId) => {
    console.log(`User ${socket.id} creating room ${roomId}`);
    
    // Clean up any existing room this player was in
    if (playerRooms[socket.id]) {
      const oldRoomId = playerRooms[socket.id];
      if (rooms[oldRoomId]) {
        rooms[oldRoomId].players = rooms[oldRoomId].players.filter(id => id !== socket.id);
        if (rooms[oldRoomId].players.length === 0) {
          delete rooms[oldRoomId];
        }
      }
      delete playerRooms[socket.id];
    }
    
    if (rooms[roomId]) {
      console.log(`Room ${roomId} already exists, rejecting creation`);
      socket.emit('room_exists');
      return;
    }
    
    // Create new room
    rooms[roomId] = {
      players: [socket.id],
      moves: {},
      createdAt: Date.now(),
      joinTimeout: null,
      gameStarted: false
    };
    
    playerRooms[socket.id] = roomId;
    socket.join(roomId);
    // Assign player number 1 to host
    socket.emit('player_number', 1);
    console.log(`Created room ${roomId} with player ${socket.id}`);
    console.log(`Current rooms:`, Object.keys(rooms));
    console.log(`Room ${roomId} players:`, rooms[roomId].players);
    
    // Set timeout to clear room if no second player joins
    rooms[roomId].joinTimeout = setTimeout(() => {
      if (!rooms[roomId]) return;
      console.log(`Room ${roomId} timed out, clearing`);
      delete rooms[roomId];
      io.to(roomId).emit('room_timeout');
    }, JOIN_TIMEOUT);
    
    socket.emit('room_created', roomId);
    io.to(roomId).emit('player_update', rooms[roomId].players.length);
    console.log(`[SOCKET] Emitting to ${socket.id}: player_number 1`);
    console.log(`[SOCKET] Emitting to ${socket.id}: room_created ${roomId}`);
    console.log(`[SOCKET] Emitting to room ${roomId}: player_update ${rooms[roomId].players.length}`);
  });
  
  socket.on('join_room', (roomId) => {
    console.log(`User ${socket.id} trying to join room ${roomId}`);
    console.log(`Available rooms:`, Object.keys(rooms));
    
    // Clean up any existing room this player was in
    if (playerRooms[socket.id]) {
      const oldRoomId = playerRooms[socket.id];
      if (rooms[oldRoomId]) {
        rooms[oldRoomId].players = rooms[oldRoomId].players.filter(id => id !== socket.id);
        if (rooms[oldRoomId].players.length === 0) {
          delete rooms[oldRoomId];
        }
      }
      delete playerRooms[socket.id];
    }
    
    if (!rooms[roomId]) {
      console.log(`Room ${roomId} doesn't exist`);
      socket.emit('room_not_found');
      return;
    }
    
    if (rooms[roomId].players.length >= 2) {
      console.log(`Room ${roomId} is full, rejecting ${socket.id}`);
      socket.emit('room_full');
      return;
    }
    
    // Check if player is already in this room (reconnection case)
    if (rooms[roomId].players.includes(socket.id)) {
      console.log(`User ${socket.id} already in room ${roomId}, skipping add`);
      socket.join(roomId);
      io.to(roomId).emit('player_update', rooms[roomId].players.length);
      return;
    }
    
    // Add player to room
    rooms[roomId].players.push(socket.id);
    playerRooms[socket.id] = roomId;
    socket.join(roomId);
    // Assign player number 2 to guest
    socket.emit('player_number', 2);
    
    console.log(`User ${socket.id} joined room ${roomId}`);
    console.log(`Room ${roomId} now has ${rooms[roomId].players.length} players:`, rooms[roomId].players);
    // Print all rooms and their player IDs only (avoid circular refs)
    const simpleRooms = Object.fromEntries(
      Object.entries(rooms).map(([id, room]) => [id, { players: room.players }])
    );
    console.log('All rooms state:', simpleRooms);
    
    // Clear the timeout since second player joined
    if (rooms[roomId].joinTimeout) {
      clearTimeout(rooms[roomId].joinTimeout);
      rooms[roomId].joinTimeout = null;
    }
    
    io.to(roomId).emit('player_update', rooms[roomId].players.length);
    console.log(`[SOCKET] Emitting to ${socket.id}: player_number 2`);
    console.log(`[SOCKET] Emitting to room ${roomId}: player_update ${rooms[roomId].players.length}`);
    
    // If both players are in the room, start the game immediately
    if (rooms[roomId].players.length === 2) {
      console.log(`Both players in room ${roomId}, starting game immediately!`);
      console.log(`Players:`, rooms[roomId].players);
      console.log(`Emitting game_start to room ${roomId}`);
      
      // Add a small delay to ensure all clients are ready
      setTimeout(() => {
        if (!rooms[roomId]) return;
        console.log(`Emitting game_start to room ${roomId} after delay`);
        rooms[roomId].gameStarted = true;
        io.to(roomId).emit('game_start');
        console.log(`game_start event emitted successfully`);
        console.log(`[SOCKET] Emitting to room ${roomId}: game_start`);
      }, 1000);
    }
  });

  socket.on('make_move', ({ roomId, move, playerNumber }) => {
    if (!rooms[roomId]) return;
    // Block moves if less than 2 players
    if (!rooms[roomId].players || rooms[roomId].players.length < 2) {
      socket.emit('opponent_left');
      console.log(`[SOCKET] Blocked move: only one player in room ${roomId}. Notifying player ${socket.id}`);
      return;
    }
    console.log(`[SERVER] Received move: playerNumber=${playerNumber}, move=${move}, roomId=${roomId}`);
    // Always use string keys for player numbers
    rooms[roomId].moves[String(playerNumber)] = move;
    console.log(`[SERVER] Current moves for room ${roomId}:`, rooms[roomId].moves);
    // Only emit when both moves are present
    if (rooms[roomId].moves['1'] && rooms[roomId].moves['2']) {
      const move1 = rooms[roomId].moves['1'];
      const move2 = rooms[roomId].moves['2'];
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
      io.to(roomId).emit('round_result', {
        moves: { 1: move1, 2: move2 },
        result,
      });
      console.log(`[SERVER] Emitting round_result to room ${roomId}:`, { moves: { 1: move1, 2: move2 }, result });
      rooms[roomId].moves = {};
      console.log(`[SOCKET] Emitting to room ${roomId}: round_result`, { moves: { 1: move1, 2: move2 }, result });
      if (rooms[roomId].moveTimeout) {
        clearTimeout(rooms[roomId].moveTimeout);
        rooms[roomId].moveTimeout = null;
      }
    } else {
      // Start or restart move timeout if only one move is present
      startMoveTimeout(roomId);
    }
  });

  socket.on('leave_room', (roomId) => {
    console.log(`User ${socket.id} leaving room ${roomId}`);
    if (rooms[roomId]) {
      // Remove from players list
      rooms[roomId].players = rooms[roomId].players.filter((id) => id !== socket.id);
      // Clear timeout if it exists
      if (rooms[roomId].joinTimeout) {
        clearTimeout(rooms[roomId].joinTimeout);
        rooms[roomId].joinTimeout = null;
      }
      io.to(roomId).emit('player_update', rooms[roomId].players.length);
      // Notify remaining player if only one left
      if (rooms[roomId] && rooms[roomId].players.length === 1 && rooms[roomId].gameStarted) {
        const remainingPlayer = rooms[roomId].players[0];
        io.to(remainingPlayer).emit('opponent_left');
        console.log(`[SOCKET] Emitting to ${remainingPlayer}: opponent_left`);
      }
      // Delete room if empty
      if (rooms[roomId] && rooms[roomId].players.length === 0) {
        console.log(`Deleting empty room ${roomId}`);
        delete rooms[roomId];
      }
    }
    delete playerRooms[socket.id];
    socket.leave(roomId);
    console.log(`[SOCKET] Emitting to room ${roomId}: player_update ${rooms[roomId] ? rooms[roomId].players.length : 0}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Client disconnected:', socket.id, 'Reason:', reason, 'at', new Date().toISOString());
    // Clean up rooms when players disconnect
    const roomId = playerRooms[socket.id];
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex > -1) {
        room.players.splice(playerIndex, 1);
        // Clear timeout if it exists
        if (room.joinTimeout) {
          clearTimeout(room.joinTimeout);
          room.joinTimeout = null;
        }
        // Notify remaining player if only one left
        if (rooms[roomId] && room.players.length === 1 && rooms[roomId].gameStarted) {
          const remainingPlayer = room.players[0];
          io.to(remainingPlayer).emit('opponent_left');
          console.log(`[SOCKET] Emitting to ${remainingPlayer}: opponent_left`);
        }
        // Delete room if empty
        if (rooms[roomId] && room.players.length === 0) {
          console.log(`Deleting empty room ${roomId} due to disconnect`);
          delete rooms[roomId];
        } else if (rooms[roomId]) {
          io.to(roomId).emit('player_update', room.players.length);
        }
      }
    }
    delete playerRooms[socket.id];
  });

  socket.on('get_game_state', (roomId) => {
    if (rooms[roomId]) {
      const started = rooms[roomId].players.length === 2;
      socket.emit('game_state', { started });
      console.log(`[SOCKET] Emitting to ${socket.id}: game_state`, { started });
    } else {
      socket.emit('game_state', { started: false });
    }
  });

  socket.on('error', (err) => {
    console.error('[SOCKET] Error on socket', socket.id, err);
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] Socket.IO server running on port ${PORT} at ${new Date().toISOString()}`);
  console.log(`[SERVER] Server URL: ${process.env.NODE_ENV === 'production' ? 'https://rock-paper-scissors-multiplayer-w3f2.onrender.com' : `http://localhost:${PORT}`}`);
}); 