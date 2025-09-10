export default class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }
    create() {
        this.add.text(300, 250, 'Tag2 Clone', { fontSize: '32px', fill: '#fff' });
        this.add.text(250, 300, 'Press SPACE to Start', { fontSize: '24px', fill: '#fff' });
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}