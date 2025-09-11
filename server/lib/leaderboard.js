import fs from 'fs';
export default class Leaderboard {
  constructor(path){
    this.path = path;
    try {
      if(!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({scores:[]},null,2));
    } catch(e){ console.error('leaderboard init err', e); }
  }
  get(){
    try { return JSON.parse(fs.readFileSync(this.path)); } catch(e){ return {scores:[]}; }
  }
  add(name, score){
    const d = this.get();
    d.scores.push({name,score,date:new Date().toISOString()});
    d.scores.sort((a,b)=>b.score-a.score);
    d.scores = d.scores.slice(0,100);
    fs.writeFileSync(this.path, JSON.stringify(d,null,2));
  }
}
