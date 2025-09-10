const Game = require('../game');
const PlayerManager = require('../playerManager');
const { v4: uuidv4 } = require('uuid');

class Matchmaker {
  constructor(io){
    this.io = io;
    this.matches = {}; // id -> { game, pm }
  }
  createMatch(opts, socket){
    const id = uuidv4().split('-')[0];
    const game = new Game(id, this.io, opts);
    const pm = new PlayerManager(game);
    game.setPlayerManager(pm);
    this.matches[id] = { game, pm };
    // auto-join creator
    pm.addPlayer(socket.id, socket);
    socket.join(id);
    this.io.to(id).emit('lobby', pm.summary());
    socket.emit('matchCreated', id);
  }
  joinMatch(id, socket){
    if (!this.matches[id]) return socket.emit('error', 'match not found');
    const { pm } = this.matches[id];
    pm.addPlayer(socket.id, socket);
    socket.join(id);
    this.io.to(id).emit('lobby', pm.summary());
  }
  leaveMatch(id, socketId){
    if (!this.matches[id]) return;
    const { pm } = this.matches[id];
    pm.removePlayer(socketId);
    this.io.to(id).emit('lobby', pm.summary());
  }
  leaveAll(socketId){
    for (const id in this.matches) this.leaveMatch(id, socketId);
  }
  list(){ return Object.keys(this.matches).map(id => ({ id, players: Object.keys(this.matches[id].pm.players).length })); }
}

module.exports = Matchmaker;
