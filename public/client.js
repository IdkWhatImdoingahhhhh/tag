
/* Top-tier kart starter client (improved visuals + kart physics)
 Uses Khronos glTF sample ToyCar as a reliable fall-back model when available.
*/

const socket = io();
let scene, camera, renderer;
let local = {id:null, mesh:null, x:0,y:0,z:0,rot:0,speed:0,lap:0};
let others = {};
let track = null;
init(); animate();

function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  // lights
  const h = new THREE.HemisphereLight(0xffffff,0x444444,0.9); scene.add(h);
  const d = new THREE.DirectionalLight(0xffffff,0.6); d.position.set(10,20,10); scene.add(d);
  // ground
  const g = new THREE.Mesh(new THREE.PlaneGeometry(400,400), new THREE.MeshStandardMaterial({color:0x2e8b57}));
  g.rotation.x = -Math.PI/2; scene.add(g);
  // load model
  const loader = new THREE.GLTFLoader();
  loader.load('assets/player_kart.glb', gltf=>{
    const model = gltf.scene; model.scale.set(0.9,0.9,0.9); local.mesh = model; scene.add(model);
  }, undefined, ()=>{
    const geo = new THREE.CapsuleGeometry(0.6,0.4,4,8);
    const mat = new THREE.MeshStandardMaterial({color:0xff4444});
    const mesh = new THREE.Mesh(geo, mat); local.mesh = mesh; scene.add(mesh);
  });
  window.addEventListener('resize', ()=>{ camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
  document.getElementById('startBtn').addEventListener('click', ()=>socket.emit('requestStart'));
  setupInput();
}

let inputState = {acc:0,steer:0,drift:false};
function setupInput(){
  window.addEventListener('keydown',(e)=>{
    if (e.code==='ArrowUp'||e.code==='KeyW') inputState.acc = 1;
    if (e.code==='ArrowDown'||e.code==='KeyS') inputState.acc = -1;
    if (e.code==='ArrowLeft'||e.code==='KeyA') inputState.steer = 1;
    if (e.code==='ArrowRight'||e.code==='KeyD') inputState.steer = -1;
    if (e.code==='Space') inputState.drift = true;
    if (e.code==='KeyR') { local.x=0; local.z=0; local.speed=0; }
  });
  window.addEventListener('keyup',(e)=>{
    if (e.code==='ArrowUp'||e.code==='KeyW') inputState.acc = 0;
    if (e.code==='ArrowDown'||e.code==='KeyS') inputState.acc = 0;
    if (e.code==='ArrowLeft'||e.code==='KeyA') inputState.steer = 0;
    if (e.code==='ArrowRight'||e.code==='KeyD') inputState.steer = 0;
    if (e.code==='Space') inputState.drift = false;
  });
}

const MAX_SPEED=18, ACC=30, BRAKE=40, TURN=3.2, DRIFT=0.55;
let lastSend=0;
function tick(dt){
  const steer = inputState.steer * TURN * (1 - Math.min(Math.abs(local.speed)/MAX_SPEED,1));
  local.rot += steer * dt * (inputState.drift?DRIFT:1);
  if (inputState.acc>0) local.speed += ACC*dt*inputState.acc;
  else if (inputState.acc<0) local.speed -= BRAKE*dt*-inputState.acc;
  else local.speed -= 8*dt*Math.sign(local.speed);
  local.speed = Math.max(Math.min(local.speed, MAX_SPEED), -8);
  local.x += Math.sin(local.rot)*local.speed*dt;
  local.z += Math.cos(local.rot)*local.speed*dt;
  if (local.mesh){ local.mesh.position.set(local.x,0.4,local.z); local.mesh.rotation.y = local.rot; }
  camera.position.lerp(new THREE.Vector3(local.x - Math.sin(local.rot)*8, 4, local.z - Math.cos(local.rot)*8), 0.12);
  camera.lookAt(new THREE.Vector3(local.x, 0.8, local.z));
  if (Date.now() - lastSend > 50){ socket.emit('input',{x:local.x,y:local.y,z:local.z,rot:local.rot,speed:local.speed}); lastSend = Date.now(); }
}

function animate(){
  requestAnimationFrame(animate);
  tick(0.016);
  renderer.render(scene, camera);
}

// networking
socket.on('joined', data=>{ local.id = data.id; if (data.track) buildTrack(data.track); if (data.players) for (const id in data.players) if (id!==local.id) addRemote(data.players[id]); });
socket.on('playerJoined', p=>{ if (p.id!==local.id) addRemote(p); });
socket.on('playerUpdate', p=>{ if (p.id===local.id) return; if (others[p.id]) others[p.id].position.lerp(new THREE.Vector3(p.x,0.4,p.z), 0.25); });
socket.on('playerLeft', id=>{ if (others[id]){ scene.remove(others[id]); delete others[id]; } });
socket.on('checkpoint', d=>{ if (d.id===local.id) document.getElementById('lap').innerText = 'Lap: '+d.lap; });

function addRemote(p){ const m = new THREE.Mesh(new THREE.BoxGeometry(1,0.4,0.8), new THREE.MeshStandardMaterial({color:0x3333ff})); m.position.set(p.x,0.4,p.z); scene.add(m); others[p.id]=m; }
function buildTrack(t){ track = t; for (let i=0;i<t.checkpoints.length;i++){ const c=t.checkpoints[i]; const r = new THREE.Mesh(new THREE.RingGeometry(1.4,1.8,32), new THREE.MeshBasicMaterial({color:0xffff00})); r.rotation.x = -Math.PI/2; r.position.set(c[0],0.05,c[1]); scene.add(r); } }
