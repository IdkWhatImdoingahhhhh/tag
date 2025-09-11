import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import GameServer from './lib/gameServer.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Leaderboard from './lib/leaderboard.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname,'..','client')));
app.use(express.json());

// leaderboard
const DATA_DIR = path.join(__dirname,'data');
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const LB_FILE = path.join(DATA_DIR,'leaderboard.json');
const leaderboard = new Leaderboard(LB_FILE);

// game server
const game = new GameServer(io);

io.on('connection', socket => {
  console.log('connect', socket.id);
  game.addPlayer(socket.id);
  socket.emit('init', { id: socket.id, state: game.getState() });

  socket.on('input', data => game.receiveInput(socket.id, data));
  socket.on('ready', ()=> { game.setReady(socket.id, true); });
  socket.on('useItem', ()=> { game.playerUseItem(socket.id); });
  socket.on('chat', msg => io.emit('chat', { from: socket.id.substring(0,6), msg }));
  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('players', game.getState());
  });
});

// simple leaderboard endpoint
app.get('/api/leaderboard', (req,res) => {
  res.json(leaderboard.get());
});

app.post('/api/leaderboard', (req,res) => {
  const { name, score } = req.body;
  if(!name||typeof score!=='number') return res.status(400).json({ error: 'name and numeric score required' });
  leaderboard.add(name, score);
  res.json({ ok:true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('listening', PORT));
