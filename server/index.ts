import * as http from "http";
import express from "express";
import path from "path";

const app = express();
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build/index.html"));
});

app.use("/static", express.static(path.resolve(__dirname, "../client/build/static")))

server.listen(3000, () => {
  console.log('listening on *:3000');
});
