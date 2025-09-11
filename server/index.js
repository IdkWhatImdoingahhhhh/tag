const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

// Default route -> index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Example socket setup
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  socket.emit('hello', { msg: 'Welcome to UniqueKartPro!' });
  socket.on('disconnect', () => console.log('Disconnected:', socket.id));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
