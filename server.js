const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);
    players[socket.id] = { x: Math.random() * 700, y: Math.random() * 500, tagger: false, score: 0 };
    if (Object.keys(players).length === 1) { players[socket.id].tagger = true; }
    io.emit('players', players);

    socket.on('move', (data) => {
        if(players[socket.id]){
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            for (let id in players) {
                if(id !== socket.id){
                    let dx = players[socket.id].x - players[id].x;
                    let dy = players[socket.id].y - players[id].y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 50){
                        if(players[socket.id].tagger){
                            players[socket.id].tagger = false;
                            players[id].tagger = true;
                            players[socket.id].score++;
                        } else if(players[id].tagger){
                            players[id].tagger = false;
                            players[socket.id].tagger = true;
                            players[id].score++;
                        }
                    }
                }
            }
        }
        io.emit('players', players);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('players', players);
        console.log('User disconnected: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
