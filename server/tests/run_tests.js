import { tickPhysics } from '../lib/physics.js';
let p = { x:0,y:0,z:0,yaw:0,speed:0 };
tickPhysics(p, { throttle:1, steer:0, drift:false }, 1/20, { checkpoints:[] });
console.log('Physics tick OK', p.x, p.z);