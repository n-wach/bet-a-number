import * as http from "http";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import GameManager from "./GameManager";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const gameManager: GameManager = new GameManager(io);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
});

// TODO: If adding any more media, figure out why webpack isn't putting these under static/
// notice that favicon.ico (url) != favicon.png (file name)
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build/favicon.png"));
});
app.get('/logo.png', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build/logo.png"));
});

app.use("/static", express.static(path.resolve(__dirname, "../client/build/static")))

io.on("connection", (socket) => {
  gameManager.player_connect(socket);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
