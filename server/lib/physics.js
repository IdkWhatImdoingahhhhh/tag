export function tickPhysics(p, input, dt, track){
  const maxSpeed = 35;
  const accel = 80;
  const brake = 120;
  const steerRate = 3.2;

  const desired = input.throttle * maxSpeed;
  const dv = desired - p.speed;
  const maxDv = (input.throttle > 0) ? accel*dt : brake*dt;
  p.speed += Math.max(-maxDv, Math.min(maxDv, dv));

  const traction = input.drift ? 0.93 : 0.985;
  p.speed *= traction;

  const steerEffect = steerRate * (1 - Math.min(Math.abs(p.speed)/maxSpeed, 0.9));
  p.yaw += input.steer * steerEffect * dt;

  p.x += Math.sin(p.yaw) * p.speed * dt * 10;
  p.z += Math.cos(p.yaw) * p.speed * dt * 10;

  // simple collision with inner/outer radii
  const R = 70;
  if(p.x*p.x + p.z*p.z > R*R) {
    // push back in bounds and reduce speed
    const ang = Math.atan2(p.z, p.x);
    p.x = Math.cos(ang)*(R-1);
    p.z = Math.sin(ang)*(R-1);
    p.speed *= 0.6;
  }
}
