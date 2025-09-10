export default class BootScene extends Phaser.Scene {
    constructor(){ super({ key:'BootScene' }); }
    preload(){
        this.load.spritesheet('player','assets/sprites/player.png',{ frameWidth:32, frameHeight:32 });
        this.load.image('background','assets/backgrounds/level1.png');
    }
    create(){ this.scene.start('MenuScene'); }
}