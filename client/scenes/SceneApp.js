import * as THREE from 'three';

export class SceneApp {
  constructor(canvas, socket){
    this.socket = socket;
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
    this.camera.position.set(0,6,-12);
    this.camera.lookAt(0,0,0);

    this.local = { x:0,y:0,z:0,yaw:0,speed:0,lap:0,checkpoint:0, inventory:[] };
    this.remotes = {}; // id -> state
    this.remoteMeshes = {};
    this.projectileMeshes = {};
    this.powerupMeshes = {};

    this._buildWorld();
    this._bindInputs();
    this._setupSocket();

    this.lastEmit = 0;
    this.lobby = { ready: {} };
  }

  _buildWorld(){
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400,400,8,8), new THREE.MeshStandardMaterial({color:0x202230}));
    ground.rotation.x = -Math.PI/2;
    this.scene.add(ground);

    // procedural track rings
    const ringGroup = new THREE.Group();
    const roadMat = new THREE.MeshStandardMaterial({color:0x1f1f1f, metalness:0.2, roughness:0.6});
    for(let i=0;i<200;i++){
      const seg = new THREE.BoxGeometry(3,0.2,6);
      const mesh = new THREE.Mesh(seg, roadMat);
      const t = i/200 * Math.PI*2;
      const r = 60;
      mesh.position.x = Math.cos(t)*r;
      mesh.position.z = Math.sin(t)*r;
      mesh.rotation.y = -t + Math.PI/2;
      ringGroup.add(mesh);
    }
    this.scene.add(ringGroup);

    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(5,10,5);
    this.scene.add(light);
    const amb = new THREE.AmbientLight(0x666688, 0.4);
    this.scene.add(amb);

    this.localMesh = this._makeKartMesh(0xff5555);
    this.scene.add(this.localMesh);

    // UI container
    const root = document.getElementById('ui-root');
    root.innerHTML = `<div id="hud" style="background:rgba(0,0,0,0.4);padding:8px;border-radius:6px;color:#fff"></div>
      <div style="position:fixed;left:12px;bottom:12px;color:#fff">
      <button id="readyBtn">Ready</button> <button id="useBtn">Use Item (Space)</button>
      </div>`;
    document.getElementById('readyBtn').addEventListener('click', ()=> this.socket.emit('ready'));
    document.getElementById('useBtn').addEventListener('click', ()=> this.socket.emit('useItem'));
    window.addEventListener('keydown', e=> { if(e.code==='Space') this.socket.emit('useItem'); });
  }

  _makeKartMesh(color){
    const g = new THREE.BoxGeometry(1.2,0.5,2.0);
    const m = new THREE.MeshStandardMaterial({color});
    const mesh = new THREE.Mesh(g,m);
    return mesh;
  }

  _bindInputs(){
    this.input = { throttle:0, steer:0, drift:false };
    window.addEventListener('keydown', e=>{
      if(e.key==='w'||e.key==='ArrowUp') this.input.throttle = 1;
      if(e.key==='s'||e.key==='ArrowDown') this.input.throttle = -1;
      if(e.key==='a'||e.key==='ArrowLeft') this.input.steer = -1;
      if(e.key==='d'||e.key==='ArrowRight') this.input.steer = 1;
      if(e.key==='Shift') this.input.drift = true;
    });
    window.addEventListener('keyup', e=>{
      if((e.key==='w'||e.key==='ArrowUp') && this.input.throttle===1) this.input.throttle = 0;
      if((e.key==='s'||e.key==='ArrowDown') && this.input.throttle===-1) this.input.throttle = 0;
      if((e.key==='a'||e.key==='ArrowLeft') && this.input.steer===-1) this.input.steer = 0;
      if((e.key==='d'||e.key==='ArrowRight') && this.input.steer===1) this.input.steer = 0;
      if(e.key==='Shift') this.input.drift = false;
    });
  }

  _setupSocket(){
    this.socket.on('init', data => {
      const state = data.state;
      for(const id in state) if(id !== this.socket.id) this._ensureRemote(id);
    });
    this.socket.on('state', data => {
      for(const id in data){
        if(id === this.socket.id){
          const s = data[id];
          this.local.x = s.x; this.local.y = s.y; this.local.z = s.z; this.local.yaw = s.yaw; this.local.speed = s.speed; this.local.lap = s.lap; this.local.inventory = s.inventory || [];
        } else {
          if(!this.remoteMeshes[id]) this._ensureRemote(id);
          this.remotes[id] = { ...data[id], t: performance.now() };
        }
      }
    });
    this.socket.on('powerups', pus => {
      // update powerup meshes
      for(const i in pus){
        const p = pus[i];
        if(!this.powerupMeshes[i]){
          const m = this._makePowerupMesh(p.type);
          this.powerupMeshes[i] = m;
          this.scene.add(m);
        }
        const mesh = this.powerupMeshes[i];
        mesh.position.set(p.x, 0.2, p.z);
        mesh.visible = !!p.active;
      }
    });
    this.socket.on('projectiles', projs => {
      // sync projectile meshes
      for(const id in projs){
        const pr = projs[id];
        if(!this.projectileMeshes[id]){
          const g = new THREE.SphereGeometry(0.2,8,8);
          const m = new THREE.MeshStandardMaterial({color:0xffcc00});
          this.projectileMeshes[id] = new THREE.Mesh(g,m);
          this.scene.add(this.projectileMeshes[id]);
        }
        this.projectileMeshes[id].position.set(projs[id].x,0.3,projs[id].z);
      }
      // remove any meshes not present
      for(const id in this.projectileMeshes){
        if(!projs[id]){
          this.scene.remove(this.projectileMeshes[id]);
          delete this.projectileMeshes[id];
        }
      }
    });
    this.socket.on('pickup', d => {
      // simple notification if you picked up something
      console.log('pickup', d);
    });
    this.socket.on('raceStart', info => {
      alert('Race starting! Laps: ' + info.laps);
    });
    this.socket.on('raceEnd', d => {
      alert('Winner: ' + d.winner);
    });
    this.socket.on('lobby', info => {
      this.lobby = info;
    });
  }

  _ensureRemote(id){
    const mesh = this._makeKartMesh(0x33ff66);
    this.remoteMeshes[id] = mesh;
    this.scene.add(mesh);
  }

  start(){
    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(()=> this._frame());
  }

  _frame(){
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._localPredict(dt);
    if(performance.now() - this.lastEmit > 50){
      this.socket.emit('input', this.input);
      this.lastEmit = performance.now();
    }
    this._interpRemotes();
    this.localMesh.position.set(this.local.x, 0.25, this.local.z);
    this.localMesh.rotation.y = -this.local.yaw;
    for(const id in this.remoteMeshes){
      const mesh = this.remoteMeshes[id];
      const s = this.remotes[id];
      if(!s) continue;
      mesh.position.x += (s.x - mesh.position.x) * 0.18;
      mesh.position.z += (s.z - mesh.position.z) * 0.18;
      mesh.rotation.y += (-s.yaw - mesh.rotation.y) * 0.18;
    }
    // camera smooth follow
    const camPos = new THREE.Vector3(this.local.x, 4, this.local.z - 10);
    this.camera.position.lerp(camPos, 0.12);
    this.camera.lookAt(this.local.x, 0.6, this.local.z + 2);
    this._updateHUD();
    this.renderer.render(this.scene, this.camera);
  }

  _localPredict(dt){
    const p = this.local;
    const input = this.input;
    const maxSpeed = 35;
    const accel = 80;
    const brake = 120;
    const steerRate = 3.2;
    const desired = input.throttle * maxSpeed;
    const dv = desired - p.speed;
    const maxDv = (input.throttle > 0) ? accel*dt : brake*dt;
    p.speed += Math.max(-maxDv, Math.min(maxDv, dv));
    p.speed *= input.drift ? 0.93 : 0.985;
    const steerEffect = steerRate * (1 - Math.min(Math.abs(p.speed)/maxSpeed, 0.9));
    p.yaw += input.steer * steerEffect * dt;
    p.x += Math.sin(p.yaw) * p.speed * dt * 10;
    p.z += Math.cos(p.yaw) * p.speed * dt * 10;
    const R = 70;
    if(p.x*p.x + p.z*p.z > R*R){
      const ang = Math.atan2(p.z, p.x);
      p.x = Math.cos(ang)*(R-1);
      p.z = Math.sin(ang)*(R-1);
      p.speed *= 0.6;
    }
  }

  _interpRemotes(){
    // already handled in frame via simple lerp
  }

  _updateHUD(){
    const root = document.getElementById('ui-root');
    if(!root) return;
    const inv = (this.local.inventory||[]).join(', ') || 'none';
    root.querySelector('#hud').innerHTML = `Lap: ${this.local.lap} / 3<br>Speed: ${Math.round(this.local.speed*10)}<br>Items: ${inv}`;
  }
}
