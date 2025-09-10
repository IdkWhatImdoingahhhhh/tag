class PlayerManager {
  constructor() { this.players = {}; }
  addPlayer(id) {
    this.players[id] = { x: Math.random()*800, y: Math.random()*600, tagger: Object.keys(this.players).length===0, score:0, speedBoost:false };
  }
  removePlayer(id) { delete this.players[id]; }
  updatePlayer(id, data) {
    if (!this.players[id]) return;
    let player = this.players[id];
    player.x = data.x; player.y = data.y;
  }
}
module.exports = PlayerManager;