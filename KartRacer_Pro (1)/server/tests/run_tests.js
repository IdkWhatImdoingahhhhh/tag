const assert = require('assert');
const Physics = require('../lib/physics');
const p = { x:0,y:0,angle:0,speed:0,throttle:1,steer:0 };
const phy = new Physics();
phy.update(p, 1/60);
console.log('Physics update ran, pos:', p.x,p.y);
assert(Math.abs(p.x) > 0, 'player should have moved');
console.log('All tests passed');