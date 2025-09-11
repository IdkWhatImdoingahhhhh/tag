
const fs = require('fs');
const path = require('path');
const https = require('https');

const dest = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

const assets = [
  { url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb', file: 'player_kart.glb' },
  { url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb', file: 'truck.glb' }
];

function download(a){
  return new Promise((res, rej)=>{
    const fp = path.join(dest, a.file);
    if (fs.existsSync(fp)) { console.log('Exists', a.file); return res(); }
    console.log('Downloading', a.url);
    const file = fs.createWriteStream(fp);
    https.get(a.url, (r)=>{
      if (r.statusCode !== 200){ console.error('Failed', a.url, r.statusCode); return res(); }
      r.pipe(file);
      file.on('finish', ()=>{ file.close(); console.log('Saved', a.file); res(); });
    }).on('error', (e)=>{ console.error('Error', e.message); res(); });
  });
}

(async ()=>{ for (const a of assets) await download(a); console.log('Asset fetch complete.'); })();
