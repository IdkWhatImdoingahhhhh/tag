const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'frontend')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'frontend','index.html')));

let players = {};
let powerUps = [];
let roundTime = 60;
let roundInterval;
const colors = ['red','blue','green','yellow','purple','orange'];

function spawnPowerUp(){
  const types=['speed','freeze','invis'];
  powerUps.push({x:Math.random()*700+50,y:Math.random()*400+50,type:types[Math.floor(Math.random()*types.length)]});
}

function startRound(){
  roundTime=60;
  powerUps=[];
  for(let i=0;i<5;i++) spawnPowerUp();
  Object.values(players).forEach(p=>p.isIt=false);
  const ids=Object.keys(players);
  if(ids.length){
    const itId=ids[Math.floor(Math.random()*ids.length)];
    players[itId].isIt=true;
  }
  io.emit('roundStart',{players,powerUps});
  clearInterval(roundInterval);
  roundInterval=setInterval(()=>{
    roundTime--;
    io.emit('timer',roundTime);
    if(roundTime<=0) startRound();
  },1000);
}

io.on('connection',socket=>{
  players[socket.id]={
    x: Math.random()*600,
    y: 300,
    vx:0, vy:0,
    isIt:false,
    color: colors[Math.floor(Math.random()*colors.length)],
    canJump:true,
    speed:5,
    score:0
  };
  if(Object.keys(players).length===1) startRound();
  io.emit('stateUpdate',players);

  socket.on('move',dir=>{
    const p=players[socket.id];
    if(!p) return;
    if(dir==='left') p.vx=-p.speed;
    if(dir==='right') p.vx=p.speed;
    if(dir==='stopX') p.vx=0;
    if(dir==='jump' && p.canJump){p.vy=-10; p.canJump=false;}
  });

  socket.on('disconnect',()=>{delete players[socket.id]; io.emit('stateUpdate',players);});
});

setInterval(()=>{
  const gravity=0.5, groundY=500;
  Object.values(players).forEach(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=gravity;
    if(p.y>groundY){p.y=groundY; p.vy=0; p.canJump=true;}
    if(p.x<0)p.x=0; if(p.x>800)p.x=800;
  });
  const it=Object.values(players).find(p=>p.isIt);
  if(it){
    Object.entries(players).forEach(([id,p])=>{
      if(p!==it){
        const dx=it.x-p.x, dy=it.y-p.y;
        if(Math.sqrt(dx*dx+dy*dy)<40){it.isIt=false; p.isIt=true; it.score++;}
      }
    });
  }
  io.emit('stateUpdate',players);
  io.emit('powerUps',powerUps);
},1000/30);

const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Server running on ${PORT}`));