class PlayerManager {
    constructor() {
        this.players = {};
    }

    addPlayer(id) {
        this.players[id] = { x: 100, y: 100, tagger: false, score: 0 };
        if (Object.keys(this.players).length === 1) this.players[id].tagger = true;
    }

    removePlayer(id) {
        delete this.players[id];
    }

    updatePlayer(id, data) {
        if (this.players[id]) {
            this.players[id].x = data.x;
            this.players[id].y = data.y;
        }
    }
}

module.exports = PlayerManager;