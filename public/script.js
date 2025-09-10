const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const playerSize = 50;
let playerId = null;
let players = {};

document.addEventListener('keydown', keyHandler);
document.addEventListener('keyup', keyHandlerUp);

let keys = {};

function keyHandler(e){ keys[e.key] = true; }
function keyHandlerUp(e){ keys[e.key] = false; }

function updatePosition(){
    if(playerId && players[playerId]){
        let p = players[playerId];
        if(keys['w'] || keys['ArrowUp']) p.y -= 5;
        if(keys['s'] || keys['ArrowDown']) p.y += 5;
        if(keys['a'] || keys['ArrowLeft']) p.x -= 5;
        if(keys['d'] || keys['ArrowRight']) p.x += 5;
        socket.emit('move', {x: p.x, y: p.y});
    }
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let id in players){
        let p = players[id];
        ctx.fillStyle = p.tagger ? 'red' : 'blue';
        ctx.fillRect(p.x, p.y, playerSize, playerSize);
    }
}

function drawScore(){
    let scoreHTML = '';
    for(let id in players){
        scoreHTML += `Player ${id.substring(0,4)}: ${players[id].score} <br>`;
    }
    document.getElementById('scoreBoard').innerHTML = scoreHTML;
}

socket.on('connect', () => { playerId = socket.id; });
socket.on('players', (data)=>{ players = data; });

function gameLoop(){
    updatePosition();
    draw();
    drawScore();
    requestAnimationFrame(gameLoop);
}
gameLoop();
