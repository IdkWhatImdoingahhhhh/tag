class GameManager {
    constructor(io) {
        this.io = io;
        this.roundActive = false;
        this.roundTime = 60;
        this.timeLeft = 0;
        this.tickInterval = null;
        this.stateInterval = null;
        this.playerManager = null;
    }

    setPlayerManager(pm) { this.playerManager = pm; }

    tryStartRound() {
        if (this.roundActive) return;
        if (!this.playerManager) return;
        const players = Object.values(this.playerManager.players || {});
        if (players.length < 2) return;
        const allReady = players.every(p => p.ready);
        if (!allReady) return;
        this.startRound();
    }

    startRound() {
        this.roundActive = true;
        this.timeLeft = this.roundTime;
        this.io.emit('roundStart', { time: this.timeLeft });
        this.tickInterval = setInterval(() => this.tick(), 1000);
        this.stateInterval = setInterval(() => this.broadcastState(), 50);
    }

    tick() {
        this.timeLeft--;
        this.io.emit('time', { time: this.timeLeft });
        if (this.timeLeft <= 0) this.endRound();
    }

    endRound() {
        this.roundActive = false;
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.stateInterval) clearInterval(this.stateInterval);
        this.io.emit('roundEnd', { players: this.playerManager.publicPlayers() });
        for (const id in this.playerManager.players) {
            this.playerManager.players[id].ready = false;
        }
        this.io.emit('lobby', this.playerManager.publicPlayers());
    }

    checkTag(players) {
        const ids = Object.keys(players);
        for (let i=0;i<ids.length;i++){
            for (let j=i+1;j<ids.length;j++){
                const a = players[ids[i]];
                const b = players[ids[j]];
                const dx = a.x - b.x; const dy = a.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 40) {
                    if (a.tagger && !b.tagger) { a.tagger=false; b.tagger=true; a.score++; }
                    else if (b.tagger && !a.tagger) { b.tagger=false; a.tagger=true; b.score++; }
                }
            }
        }
    }

    broadcastState() {
        if (!this.playerManager) return;
        this.checkTag(this.playerManager.players);
        this.io.emit('state', { players: this.playerManager.publicPlayers() });
    }
}

module.exports = GameManager;
