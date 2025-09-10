export default class BootScene extends Phaser.Scene{
  constructor(){super({key:'BootScene'});}
  preload(){
    this.load.image('player','assets/sprites/player.png');
    this.load.image('powerup','assets/sprites/powerup.png');
    this.load.image('arena','assets/backgrounds/arena.png');
  }
  create(){ this.scene.start('MenuScene'); }
}