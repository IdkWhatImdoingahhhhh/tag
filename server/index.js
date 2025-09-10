const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const GameManager = require('./gameManager');
const PlayerManager = require('./playerManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static('client'));

const gameManager = new GameManager(io);
const playerManager = new PlayerManager(gameManager);
gameManager.setPlayerManager(playerManager);

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    playerManager.addPlayer(socket.id, socket);

    // Send initial lobby state
    io.emit('lobby', playerManager.publicPlayers());

    socket.on('playerReady', (ready) => {
        playerManager.setReady(socket.id, !!ready);
        io.emit('lobby', playerManager.publicPlayers());
        gameManager.tryStartRound();
    });

    socket.on('input', (input) => {
        playerManager.updateInput(socket.id, input);
    });

    socket.on('disconnect', () => {
        console.log('disconnect', socket.id);
        playerManager.removePlayer(socket.id);
        io.emit('lobby', playerManager.publicPlayers());
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
