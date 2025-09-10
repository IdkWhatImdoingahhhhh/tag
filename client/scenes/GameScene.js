export default class GameScene extends Phaser.Scene {
    constructor(){ super({ key: 'GameScene' }); }
    create(){
        this.socket = io();
        this.add.image(400,300,'map');
        this.players = {};
        this.sprites = {};

        this.socket.on('state',(data)=>{
            for (const id in data.players){
                const p = data.players[id];
                if (!this.sprites[id]) this.spawnPlayer(id,p);
                else this.syncSprite(id,p);
            }
        });

        this.socket.on('time',(data)=>{
            if (!this.timerText) this.timerText = this.add.text(650,20,'', { fontSize:'20px', fill:'#fff' });
            this.timerText.setText('Time: ' + data.time);
        });

        this.socket.on('roundEnd',(data)=>{
            const overlay = this.add.rectangle(400,300,600,400,0x000000,0.8);
            this.add.text(320,180,'Round Over — Scores',{ fontSize:'28px', fill:'#fff' });
            let y = 230;
            for (const id in data.players){
                const p = data.players[id];
                this.add.text(300,y, id.substring(0,6) + ' — ' + p.score, { fontSize:'20px', fill:'#fff' });
                y += 30;
            }
            this.add.text(300,y+10, 'Press SPACE to go to Lobby', { fontSize:'18px', fill:'#ccc' });
            this.input.keyboard.once('keydown-SPACE', ()=> this.scene.start('MenuScene'));
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.local = null;
        this.socket.on('state',(data)=>{
            if (this.socket.id && data.players[this.socket.id]) this.local = data.players[this.socket.id];
        });

        this.inputTimer = this.time.addEvent({ delay:50, loop:true, callback:()=>{
            if (!this.local) return;
            const spd = 200 * (50/1000);
            let nx = this.local.x, ny = this.local.y;
            if (this.cursors.left.isDown) nx -= spd;
            if (this.cursors.right.isDown) nx += spd;
            if (this.cursors.up.isDown) ny -= spd;
            if (this.cursors.down.isDown) ny += spd;
            this.socket.emit('input',{ x: nx, y: ny, vx:0, vy:0 });
        }});
    }

    spawnPlayer(id,p){
        const s = this.physics.add.sprite(p.x,p.y,'player');
        s.setCollideWorldBounds(true);
        s.setScale(1.2);
        this.sprites[id]=s;
    }

    syncSprite(id,p){
        const s = this.sprites[id];
        s.x += (p.x - s.x) * 0.25;
        s.y += (p.y - s.y) * 0.25;
        s.setTint(p.tagger ? 0xff4444 : 0xffffff);
    }
}
