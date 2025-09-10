const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const Matchmaker = require('./lib/matchmaker');
const Leaderboard = require('./lib/leaderboard');
const Game = require('./game');
const PlayerManager = require('./playerManager');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static('client'));
app.use(express.json());

// data dir
const DATA_DIR = path.join(__dirname,'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// libs
const matchmaker = new Matchmaker(io);
const leaderboard = new Leaderboard(path.join(DATA_DIR,'leaderboard.json'));

// expose minimal REST
app.get('/api/leaderboard', (req,res) => { res.json(leaderboard.get()); });

io.on('connection', (socket) => {
  console.log('connect', socket.id);
  socket.on('createMatch', (opts) => matchmaker.createMatch(opts, socket));
  socket.on('joinMatch', (rid) => matchmaker.joinMatch(rid, socket));
  socket.on('leaveMatch', (rid) => matchmaker.leaveMatch(rid, socket));
  socket.on('listMatches', ()=> socket.emit('matches', matchmaker.list()));
  socket.on('disconnect', ()=> matchmaker.leaveAll(socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('Server listening on', PORT));
