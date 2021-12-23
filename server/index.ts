import * as http from "http";
import express from "express";
import path from "path";
import { Server } from "socket.io";
import GameManager from "./GameManager";

const gameManager: GameManager = new GameManager();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
});

app.use("/static", express.static(path.resolve(__dirname, "../client/build/static")))

io.on("connection", (socket) => {
  gameManager.player_connect(socket);
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
