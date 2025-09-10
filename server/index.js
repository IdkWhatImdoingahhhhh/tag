const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const GameManager = require('./gameManager');
const PlayerManager = require('./playerManager');
const PowerupManager = require('./powerupManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('client'));

const gameManager = new GameManager();
const playerManager = new PlayerManager();
const powerupManager = new PowerupManager();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  playerManager.addPlayer(socket.id);

  socket.emit('init', { id: socket.id, players: playerManager.players });

  socket.on('move', (data) => {
    playerManager.updatePlayer(socket.id, data);
    gameManager.checkTag(playerManager.players);
    io.emit('players', playerManager.players);
  });

  socket.on('disconnect', () => {
    playerManager.removePlayer(socket.id);
    io.emit('players', playerManager.players);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));