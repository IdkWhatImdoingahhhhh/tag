export default class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }
    create() {
        this.socket = io();
        this.add.image(400, 300, 'background');
        this.players = {};
        this.playerSprites = {};

        this.socket.on('init', (data) => {
            for (let id in data.players) this.addPlayer(id, data.players[id]);
        });

        this.socket.on('players', (data) => {
            for (let id in data) {
                if (!this.players[id]) this.addPlayer(id, data[id]);
                else this.updatePlayerSprite(id, data[id]);
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    addPlayer(id, data) {
        this.players[id] = data;
        this.playerSprites[id] = this.physics.add.sprite(data.x, data.y, 'player');
    }

    updatePlayerSprite(id, data) {
        const sprite = this.playerSprites[id];
        sprite.x = data.x; sprite.y = data.y;
    }

    update() {
        const playerId = this.socket.id;
        if (!this.players[playerId]) return;
        let p = this.players[playerId];
        if (this.cursors.left.isDown) p.x -= 5;
        if (this.cursors.right.isDown) p.x += 5;
        if (this.cursors.up.isDown) p.y -= 5;
        if (this.cursors.down.isDown) p.y += 5;
        this.socket.emit('move', { x: p.x, y: p.y });
    }
}