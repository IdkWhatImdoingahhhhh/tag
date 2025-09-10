class GameManager {
    checkTag(players) {
        const ids = Object.keys(players);
        for (let i=0;i<ids.length;i++){
            for (let j=i+1;j<ids.length;j++){
                const p1 = players[ids[i]];
                const p2 = players[ids[j]];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 50){
                    if (p1.tagger) { p1.tagger=false; p2.tagger=true; p1.score++; }
                    else if (p2.tagger) { p2.tagger=false; p1.tagger=true; p2.score++; }
                }
            }
        }
    }
}

module.exports = GameManager;