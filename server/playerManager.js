class PlayerManager {
  constructor(game){ this.players = {}; this.game = game; }
  addPlayer(id, socket, opts={}){
    const isBot = !!opts.bot;
    this.players[id] = { id, x: 100 + Math.random()*600, y: 100+Math.random()*400, angle:0, speed:0, throttle:0, steer:0, lap:0, checkpoint:-1, ready:!!opts.ready, isBot, socketId:isBot?null:socket.id, profile:{name:opts.name||id} };
  }
  removePlayer(id){ delete this.players[id]; }
  setReady(id,val){ if (this.players[id]) this.players[id].ready = val; }
  updateInput(id,input){ const p=this.players[id]; if (!p) return; if (typeof input.throttle==='number') p.throttle=input.throttle; if (typeof input.steer==='number') p.steer=input.steer; }
  summary(){ const out={}; for(const id in this.players){ const p=this.players[id]; out[id] = { id:p.id, x:p.x, y:p.y, angle:p.angle, speed:p.speed, lap:p.lap, checkpoint:p.checkpoint, ready:p.ready, isBot:p.isBot, name:p.profile.name }; } return out; }
}
module.exports = PlayerManager;
