import Boot from './scenes/Boot.js';
import Lobby from './scenes/Lobby.js';
import Race from './scenes/Race.js';
const config = { type: Phaser.AUTO, width:1024, height:768, parent:'gameContainer', physics:{ default:'arcade', arcade:{ debug:false } }, scene:[Boot,Lobby,Race] };
new Phaser.Game(config);
