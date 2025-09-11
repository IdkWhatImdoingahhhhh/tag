import * as THREE from 'three';
const socket = io();

class SceneApp {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.hud = document.getElementById('hud');

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        this.scene.add(dirLight);

        const points = [
            new THREE.Vector3(0, 0, 50),
            new THREE.Vector3(20, 0, 30),
            new THREE.Vector3(30, 0, 0),
            new THREE.Vector3(10, 0, -30),
            new THREE.Vector3(-20, 0, -20),
            new THREE.Vector3(-25, 0, 10),
            new THREE.Vector3(0, 0, 50)
        ];
        this.trackPath = new THREE.CatmullRomCurve3(points, true);
        const trackGeo = new THREE.TubeGeometry(this.trackPath, 200, 4, 8, true);
        const trackMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        this.track = new THREE.Mesh(trackGeo, trackMat);
        this.scene.add(this.track);

        const lineGeo = new THREE.BoxGeometry(8, 0.1, 1);
        const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.finishLine = new THREE.Mesh(lineGeo, lineMat);
        this.finishLine.position.copy(points[0]);
        this.scene.add(this.finishLine);

        this.localKart = this._makeKart(0xff0000);
        this.scene.add(this.localKart);
        this.remoteKarts = {};

        this.localState = { x: 0, z: 50, yaw: 0, speed: 0, lap: 0 };
        this.players = {};
        this.input = { throttle: 0, steer: 0 };

        window.addEventListener('keydown', e => {
            if (e.key === 'w') this.input.throttle = 1;
            if (e.key === 's') this.input.throttle = -1;
            if (e.key === 'a') this.input.steer = -1;
            if (e.key === 'd') this.input.steer = 1;
        });
        window.addEventListener('keyup', e => {
            if (e.key === 'w' || e.key === 's') this.input.throttle = 0;
            if (e.key === 'a' || e.key === 'd') this.input.steer = 0;
        });

        socket.on('state', data => this.players = data);
        this.clock = new THREE.Clock();
        this.renderer.setAnimationLoop(() => this._frame());
    }

    _makeKart(color) {
        const geo = new THREE.BoxGeometry(1, 0.5, 2);
        const mat = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.25;
        return mesh;
    }

    _frame() {
        const dt = this.clock.getDelta();
        this.localState.speed += (this.input.throttle * 5 - this.localState.speed) * 0.1;
        this.localState.yaw += this.input.steer * 0.03;
        this.localState.x += Math.sin(this.localState.yaw) * this.localState.speed * dt * 10;
        this.localState.z += Math.cos(this.localState.yaw) * this.localState.speed * dt * 10;

        const finishPos = this.finishLine.position;
        const dist = Math.sqrt((this.localState.x - finishPos.x) ** 2 + (this.localState.z - finishPos.z) ** 2);
        if (dist < 2 && this.localState.speed > 0) this.localState.lap++;

        this.localKart.position.set(this.localState.x, 0.25, this.localState.z);
        this.localKart.rotation.y = -this.localState.yaw;

        const camTarget = new THREE.Vector3(this.localState.x, 0.25, this.localState.z);
        const camPos = new THREE.Vector3(this.localState.x - 5 * Math.sin(this.localState.yaw), 5, this.localState.z - 5 * Math.cos(this.localState.yaw));
        this.camera.position.lerp(camPos, 0.1);
        this.camera.lookAt(camTarget);

        for (const id in this.players) {
            if (id === socket.id) continue;
            const p = this.players[id];
            if (!this.remoteKarts[id]) {
                this.remoteKarts[id] = this._makeKart(0x00ff00);
                this.scene.add(this.remoteKarts[id]);
            }
            const mesh = this.remoteKarts[id];
            mesh.position.lerp(new THREE.Vector3(p.x, 0.25, p.z), 0.1);
            mesh.rotation.y += (-p.yaw - mesh.rotation.y) * 0.1;
        }

        this.hud.innerText = `Lap: ${this.localState.lap} / 3`;
        socket.emit('input', this.localState);
        this.renderer.render(this.scene, this.camera);
    }
}

window.app = new SceneApp();