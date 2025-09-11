const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname,'../client')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'../client/index.html')));

let players={};

io.on('connection', socket=>{
  players[socket.id]={x:0,z:50,yaw:0,speed:0,lap:0};
  socket.on('input', data=>{
    if(players[socket.id]) Object.assign(players[socket.id], data);
  });
  socket.on('disconnect', ()=>{ delete players[socket.id]; });
});

setInterval(()=>{ io.emit('state',players); },50);
server.listen(PORT, ()=>console.log('Server running on port',PORT));
