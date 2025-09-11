
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));

let room = { players: {}, items: [], started: false, track: generateTrack() };

function generateTrack() {
  const cps = [];
  const R = 30, n = 10;
  for (let i=0;i<n;i++){ const a = i*(Math.PI*2)/n; cps.push([Math.cos(a)*R, Math.sin(a)*R]); }
  return { checkpoints: cps };
}

io.on('connection', socket => {
  console.log('connect', socket.id);
  room.players[socket.id] = { id: socket.id, x: 0, y: 0, z: 0, rot:0, speed:0, lap:0, nextCheckpoint:0 };
  socket.join('default');
  socket.emit('joined', { id: socket.id, track: room.track, players: room.players });
  io.to('default').emit('playerJoined', room.players[socket.id]);

  socket.on('input', data => {
    const p = room.players[socket.id];
    if (!p) return;
    // naive authoritative update with basic validation
    p.x = data.x; p.y = data.y; p.z = data.z; p.rot = data.rot; p.speed = data.speed;
    // checkpoint detection
    const cp = room.track.checkpoints[p.nextCheckpoint];
    const dx = p.x - cp[0], dz = p.z - cp[1];
    if (Math.sqrt(dx*dx + dz*dz) < 3) {
      p.nextCheckpoint = (p.nextCheckpoint + 1) % room.track.checkpoints.length;
      if (p.nextCheckpoint === 0) p.lap += 1;
      io.to('default').emit('checkpoint', { id: p.id, lap: p.lap, nextCheckpoint: p.nextCheckpoint });
    }
    socket.broadcast.to('default').emit('playerUpdate', p);
  });

  socket.on('requestStart', ()=>{
    room.started = true;
    io.to('default').emit('raceStart');
  });

  socket.on('disconnect', ()=>{
    delete room.players[socket.id];
    io.to('default').emit('playerLeft', socket.id);
  });
});

server.listen(PORT, ()=>console.log('listening', PORT));
