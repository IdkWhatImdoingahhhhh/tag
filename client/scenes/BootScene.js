export default class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }
    preload() {
        this.load.image('player', 'assets/sprites/player.png');
        this.load.image('background', 'assets/backgrounds/level1.png');
    }
    create() { this.scene.start('MenuScene'); }
}