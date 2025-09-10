class Physics {
  constructor(){ this.params = { maxSpeed: 600, accel: 800, steerRate: 3.2, traction:0.986 }; }
  update(p, dt){
    const desired = (p.throttle||0) * this.params.maxSpeed;
    const dv = desired - (p.speed||0);
    const perTick = this.params.accel * dt;
    p.speed = (p.speed||0) + Math.max(-perTick, Math.min(perTick, dv));
    p.speed *= this.params.traction;
    const steerRatio = (1 - Math.min(Math.abs(p.speed)/this.params.maxSpeed, 0.95));
    p.angle += (p.steer||0) * this.params.steerRate * steerRatio * dt;
    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;
  }
}
module.exports = Physics;
