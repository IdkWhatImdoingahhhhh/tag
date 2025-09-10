class PlayerManager {
    constructor(gameManager) {
        this.players = {};
        this.gameManager = gameManager;
    }

    addPlayer(id, socket) {
        this.players[id] = {
            id,
            x: Math.floor(100 + Math.random() * 600),
            y: Math.floor(100 + Math.random() * 400),
            vx: 0, vy: 0,
            tagger: false,
            score: 0,
            ready: false,
            socketId: socket.id
        };
        if (Object.keys(this.players).length === 1) this.players[id].tagger = true;
    }

    removePlayer(id) {
        delete this.players[id];
        const ids = Object.keys(this.players);
        if (ids.length && !ids.some(i => this.players[i].tagger)) {
            this.players[ids[0]].tagger = true;
        }
    }

    setReady(id, val) {
        if (this.players[id]) this.players[id].ready = val;
    }

    updateInput(id, input) {
        const p = this.players[id];
        if (!p) return;
        if (typeof input.x === 'number') p.x = input.x;
        if (typeof input.y === 'number') p.y = input.y;
        if (typeof input.vx === 'number') p.vx = input.vx;
        if (typeof input.vy === 'number') p.vy = input.vy;
    }

    publicPlayers() {
        const out = {};
        for (const id in this.players) {
            const p = this.players[id];
            out[id] = { id: p.id, x: p.x, y: p.y, tagger: p.tagger, score: p.score, ready: p.ready };
        }
        return out;
    }
}

module.exports = PlayerManager;
