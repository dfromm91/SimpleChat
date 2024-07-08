const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const rooms = {}; // Store the WebSocket clients per room

app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/chatapp/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create a new room and redirect to the room URL
app.get('/chatapp/create', (req, res) => {
  const roomId = uuidv4();
  rooms[roomId] = new Set();
  res.redirect(`/chatapp/room/${roomId}`);
});

// Serve the room page
app.get('/chatapp/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// Handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomId = url.pathname.split('/')[3]; // Adjusted index for roomId

  if (rooms[roomId]) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, roomId);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws, request, roomId) => {
  // Add client to the room
  rooms[roomId].add(ws);

ws.on('message', (message) => {
  console.log(`Message received in room ${roomId}: ${message}`);
  // Broadcast message to all clients in the room
  rooms[roomId].forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});




  ws.on('close', () => {
    // Remove client from the room
    rooms[roomId].delete(ws);
    // Clean up empty rooms
    if (rooms[roomId].size === 0) {
      delete rooms[roomId];
    }
  });

  ws.send(`Welcome to room: ${roomId}`);
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
