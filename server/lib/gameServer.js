import { tickPhysics } from './physics.js';

const TICK_MS = 50; // 20Hz
const BROADCAST_MS = 100;

export default class GameServer {
  constructor(io){
    this.io = io;
    this.players = {}; // id->state
    this.inputs = {};
    this.ready = {}; // id->bool
    this.projectiles = {}; // pid -> {x,z,yaw,owner,life}
    this.powerups = []; // x,z,type,active
    this.track = this._createTrack();
    this._spawnPowerups();
    this._startLoops();
  }

  _startLoops(){
    this.tickHandle = setInterval(()=> this._tick(), TICK_MS);
    this.broadcastHandle = setInterval(()=> this._broadcast(), BROADCAST_MS);
  }

  addPlayer(id){
    const count = Object.keys(this.players).length;
    const start = this.track.startPositions[count % this.track.startPositions.length];
    this.players[id] = { id, x:start.x, y:0, z:start.z, yaw:start.yaw, speed:0, lap:0, checkpoint:0, lastSeen:Date.now(), ai:false, inventory:[] };
    this.ready[id] = false;
    if(Object.keys(this.players).length < 2) this._ensureBots();
    this.io.emit('players', this.getState());
  }

  setReady(id, val){
    this.ready[id] = !!val;
    // if all humans ready and min players, start race
    const humans = Object.keys(this.players).filter(pid=>!this.players[pid].ai);
    if(humans.length>0 && humans.every(h=>this.ready[h])) this._startRace();
    this.io.emit('lobby', { ready: this.ready });
  }

  _startRace(){
    // reset laps and position to start
    let i=0;
    for(const id in this.players){
      const p = this.players[id];
      const st = this.track.startPositions[i % this.track.startPositions.length];
      p.x = st.x; p.z = st.z; p.yaw = st.yaw; p.lap = 0; p.checkpoint = 0; p.speed = 0;
      i++;
    }
    this.io.emit('raceStart', { laps: 3 });
  }

  _ensureBots(){
    const needed = Math.max(0, 2 - Object.values(this.players).filter(p=>p.ai).length);
    for(let i=0;i<needed;i++){
      const bid = 'bot_'+Math.random().toString(36).slice(2,8);
      const start = this.track.startPositions[Math.floor(Math.random()*this.track.startPositions.length)];
      this.players[bid] = { id:bid, x:start.x, y:0, z:start.z, yaw:start.yaw, speed:0, lap:0, checkpoint:0, lastSeen:Date.now(), ai:true, inventory:[] };
      this.inputs[bid] = { throttle:1, steer:0, drift:false };
    }
  }

  removePlayer(id){
    delete this.players[id];
    delete this.inputs[id];
    delete this.ready[id];
  }

  receiveInput(id, input){
    this.inputs[id] = input;
    if(this.players[id]) this.players[id].lastSeen = Date.now();
  }

  playerUseItem(id){
    const p = this.players[id];
    if(!p || !p.inventory || p.inventory.length===0) return;
    const item = p.inventory.shift();
    if(item === 'boost'){
      p.speed += 12;
    } else if(item === 'projectile'){
      const pid = 'proj_'+Math.random().toString(36).slice(2,9);
      this.projectiles[pid] = { id: pid, x: p.x + Math.sin(p.yaw)*2, z: p.z + Math.cos(p.yaw)*2, yaw: p.yaw, owner: id, life: 3000 };
    } else if(item === 'shield'){
      p._shield = 2000; // ms
    }
  }

  _spawnPowerups(){
    // place 6 powerups around track
    this.powerups = [];
    for(let i=0;i<6;i++){
      const t = i/6 * Math.PI*2;
      const r = 45 + (i%2)*5;
      this.powerups.push({ x: Math.cos(t)*r, z: Math.sin(t)*r, type: (i%3===0?'boost':(i%3===1?'projectile':'shield')), active:true });
    }
  }

  _tick(){
    // simple AI follow
    for(const id in this.players){
      const p = this.players[id];
      if(p.ai){
        const target = this._checkpointTarget(p.checkpoint);
        const dx = target.x - p.x, dz = target.z - p.z;
        const ang = Math.atan2(dx, dz);
        const da = ang - p.yaw;
        const steer = Math.max(-1, Math.min(1, da*2));
        this.inputs[id] = { throttle: 1, steer, drift: false };
      }
    }

    const dt = TICK_MS/1000;
    // update physics and projectiles
    for(const id in this.players){
      const p = this.players[id];
      const inp = this.inputs[id] || { throttle:0, steer:0, drift:false };
      tickPhysics(p, inp, dt, this.track);
      // powerup pickup
      for(let i=0;i<this.powerups.length;i++){
        const pu = this.powerups[i];
        if(!pu.active) continue;
        const dx = p.x - pu.x, dz = p.z - pu.z;
        if(dx*dx + dz*dz < 4*4){
          p.inventory.push(pu.type);
          pu.active = false;
          this.io.to().emit && this.io.emit('pickup', { id, type: pu.type }); // notify
        }
      }
      // checkpoint detection
      const cp = this._getCheckpointIndex(p);
      if(cp !== p.checkpoint){
        if(cp === 0 && p.checkpoint === this.track.checkpoints.length-1){
          p.lap = Math.min(3, p.lap+1);
        }
        p.checkpoint = cp;
      }
      // shield timer
      if(p._shield) p._shield = Math.max(0, p._shield - TICK_MS);
    }

    // update projectiles
    const now = Date.now();
    for(const pid in this.projectiles){
      const pr = this.projectiles[pid];
      pr.x += Math.sin(pr.yaw) * 1.0 * (TICK_MS/50) * 5;
      pr.z += Math.cos(pr.yaw) * 1.0 * (TICK_MS/50) * 5;
      pr.life -= TICK_MS;
      if(pr.life <= 0){
        delete this.projectiles[pid];
        continue;
      }
      // check collision with players
      for(const id in this.players){
        const p = this.players[id];
        if(id === pr.owner) continue;
        const dx = p.x - pr.x, dz = p.z - pr.z;
        if(dx*dx + dz*dz < 3*3){
          if(p._shield && p._shield>0){
            // destroy projectile, shield absorbs
            delete this.projectiles[pid];
            break;
          } else {
            // slow player and remove projectile
            p.speed *= 0.3;
            delete this.projectiles[pid];
            break;
          }
        }
      }
    }

    // remove stale players
    const tnow = Date.now();
    for(const id in this.players){
      if(!this.players[id].ai && tnow - this.players[id].lastSeen > 90000){
        delete this.players[id];
        delete this.inputs[id];
      }
    }
  }

  _broadcast(){
    this.io.emit('state', this.getState());
    this.io.emit('powerups', this.powerups);
    this.io.emit('projectiles', this.projectiles);
    // check winner
    for(const id in this.players){
      if(this.players[id].lap >= 3){
        this.io.emit('raceEnd', { winner: id });
        // reset
        for(const pid in this.players){ this.players[pid].lap = 0; this.players[pid].checkpoint = 0; }
      }
    }
  }

  getState(){
    const out = {};
    for(const id in this.players){
      const p = this.players[id];
      out[id] = { x:p.x, y:p.y, z:p.z, yaw:p.yaw, speed:p.speed, lap:p.lap, checkpoint:p.checkpoint, ai:p.ai, inventory: p.inventory || [] };
    }
    return out;
  }

  _createTrack(){
    const checkpoints = [];
    const startPositions = [];
    const segments = 12;
    const radius = 60;
    for(let i=0;i<segments;i++){
      const t = i/segments * Math.PI*2;
      const x = Math.cos(t)*radius;
      const z = Math.sin(t)*radius;
      checkpoints.push({x,z,r:8});
      if(i<6) startPositions.push({x: x + (Math.random()*2-1)*2, z: z - 6, yaw: t+Math.PI});
    }
    return { checkpoints, startPositions };
  }

  _getCheckpointIndex(p){
    for(let i=0;i<this.track.checkpoints.length;i++){
      const c = this.track.checkpoints[i];
      const dx = p.x - c.x, dz = p.z - c.z;
      if(dx*dx + dz*dz <= c.r*c.r) return i;
    }
    return p.checkpoint;
  }

  _checkpointTarget(idx){
    const next = (idx+1) % this.track.checkpoints.length;
    return this.track.checkpoints[next];
  }
}
