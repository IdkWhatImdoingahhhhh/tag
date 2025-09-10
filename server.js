const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve the prebuilt React frontend
app.use(express.static(path.join(__dirname, "frontend", "build")));

// All other routes return the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

// Multiplayer tag logic
let players = {};
let itPlayer = null;

io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  players[socket.id] = { x: 200, y: 200, isIt: false };
  if (!itPlayer) {
    itPlayer = socket.id;
    players[socket.id].isIt = true;
  }

  io.emit("stateUpdate", players);

  socket.on("move", (dir) => {
    const speed = 5;
    if (!players[socket.id]) return;
    if (dir === "up") players[socket.id].y -= speed;
    if (dir === "down") players[socket.id].y += speed;
    if (dir === "left") players[socket.id].x -= speed;
    if (dir === "right") players[socket.id].x += speed;

    // Check if the "it" player tags someone
    if (players[itPlayer] && socket.id !== itPlayer) {
      const dx = players[itPlayer].x - players[socket.id].x;
      const dy = players[itPlayer].y - players[socket.id].y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        players[itPlayer].isIt = false;
        itPlayer = socket.id;
        players[itPlayer].isIt = true;
      }
    }

    io.emit("stateUpdate", players);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    if (socket.id === itPlayer) {
      const ids = Object.keys(players);
      itPlayer = ids.length ? ids[0] : null;
      if (itPlayer) players[itPlayer].isIt = true;
    }
    io.emit("stateUpdate", players);
  });
});

// Use port from Render or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
