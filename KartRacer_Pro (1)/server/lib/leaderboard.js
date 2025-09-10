const fs = require('fs');
class Leaderboard {
  constructor(path){ this.path = path; if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({scores:[]}, null, 2)); }
  get(){ return JSON.parse(fs.readFileSync(this.path)); }
  add(name, score){ const d = this.get(); d.scores.push({ name, score, date: new Date().toISOString() }); d.scores.sort((a,b)=>b.score-a.score); d.scores = d.scores.slice(0,100); fs.writeFileSync(this.path, JSON.stringify(d,null,2)); }
}
module.exports = Leaderboard;
