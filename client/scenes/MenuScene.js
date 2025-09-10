export default class MenuScene extends Phaser.Scene {
    constructor(){ super({ key: 'MenuScene' }); }
    create(){
        this.socket = io();
        this.add.text(220,140,'Tag2 — Lobby',{ fontSize:'36px', fill:'#fff' });
        this.statusText = this.add.text(200,200,'Waiting for players...', { fontSize:'20px', fill:'#ddd' });
        this.add.text(200,240,'Press R to toggle Ready', { fontSize:'18px', fill:'#aaa' });

        this.socket.on('lobby',(players)=>{
            // clear and draw list
            let y = 300;
            for (const id in players){
                const p = players[id];
                this.add.text(200,y, (p.ready ? '[✔] ' : '[ ] ') + id.substring(0,6) + (p.tagger ? ' (tagger)' : ''), { fontSize:'18px', fill:'#fff' });
                y += 28;
            }
        });

        this.input.keyboard.on('keydown-R', ()=>{
            this.ready = !this.ready;
            this.socket.emit('playerReady', this.ready);
            this.statusText.setText(this.ready ? 'Ready — waiting for others' : 'Not Ready');
        });

        this.socket.on('roundStart',(data)=>{
            this.scene.start('GameScene');
        });
    }
}
