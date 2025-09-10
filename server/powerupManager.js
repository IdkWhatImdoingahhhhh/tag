class PowerupManager {
  constructor(){ this.powerups=[]; }
  spawnPowerup(){ this.powerups.push({ x:Math.random()*800, y:Math.random()*600, type:'speed' }); }
  collectPowerup(player, idx){
    const powerup=this.powerups[idx];
    if(!powerup) return;
    if(powerup.type==='speed') player.speedBoost=true;
    this.powerups.splice(idx,1);
  }
}
module.exports = PowerupManager;