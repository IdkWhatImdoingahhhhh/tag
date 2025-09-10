export default class GameScene extends Phaser.Scene {
    constructor(){ super({ key:'GameScene' }); }
    create(){
        this.socket = io();
        this.add.image(400,300,'background');
        this.players = {};
        this.playerSprites = {};

        this.socket.on('init',(data)=>{ for(let id in data.players)this.addPlayer(id,data.players[id]); });
        this.socket.on('players',(data)=>{ for(let id in data){ if(!this.players[id])this.addPlayer(id,data[id]); else this.updatePlayerSprite(id,data[id]); } });

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    addPlayer(id,data){
        this.players[id]=data;
        const sprite = this.physics.add.sprite(data.x,data.y,'player');
        if(data.tagger)sprite.setTint(0xff0000);
        this.playerSprites[id]=sprite;
    }

    updatePlayerSprite(id,data){
        const sprite=this.playerSprites[id];
        sprite.x=data.x; sprite.y=data.y;
        sprite.setTint(data.tagger?0xff0000:0xffffff);
    }

    update(){
        const playerId=this.socket.id;
        if(!this.players[playerId])return;
        let p=this.players[playerId];
        const speed=200;
        if(this.cursors.left.isDown)p.x-=speed*0.016;
        if(this.cursors.right.isDown)p.x+=speed*0.016;
        if(this.cursors.up.isDown)p.y-=speed*0.016;
        if(this.cursors.down.isDown)p.y+=speed*0.016;
        this.socket.emit('move',{x:p.x,y:p.y,vx:0,vy:0});
    }
}