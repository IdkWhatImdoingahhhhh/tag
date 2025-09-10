import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: { default:'arcade', arcade:{ debug:false, gravity:{y:0} } },
    scene: [BootScene, MenuScene, GameScene]
};

new Phaser.Game(config);