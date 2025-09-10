const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let players = {};
let powerUps = [];
let timer = 60;

document.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft') socket.emit('move','left');
  if(e.key==='ArrowRight') socket.emit('move','right');
  if(e.key===' ') socket.emit('move','jump');
});
document.addEventListener('keyup', e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight') socket.emit('move','stopX');
});

socket.on('stateUpdate', data => players=data);
socket.on('timer', t => timer=t);
socket.on('powerUps', data => powerUps=data);

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw players
  Object.values(players).forEach(p=>{
    ctx.fillStyle=p.isIt?'white':p.color;
    ctx.beginPath(); ctx.arc(p.x,p.y,20,0,Math.PI*2); ctx.fill();
  });
  // Draw power-ups
  powerUps.forEach(p=>{
    ctx.fillStyle=p.type==='speed'?'yellow':p.type==='freeze'?'cyan':'magenta';
    ctx.beginPath(); ctx.rect(p.x-10,p.y-10,20,20); ctx.fill();
  });
  // Timer
  ctx.fillStyle='white'; ctx.font='24px sans-serif'; ctx.fillText(`Time: ${timer}`,10,30);
  requestAnimationFrame(draw);
}
draw();