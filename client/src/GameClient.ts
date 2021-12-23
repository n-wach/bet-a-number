import {io, Socket} from "socket.io-client";
import {Card, Game, GameId} from "./shared";

type AvailableGamesChangeCallback = (games: GameId[]) => any;
type GameUpdateCallback = (game: Game | null) => any;

export default class GameClient {
  private socket: Socket;
  private available_games: GameId[];
  private available_games_change_callback: AvailableGamesChangeCallback | null;
  private game: Game | null;
  private game_update_callback: GameUpdateCallback | null;

  constructor() {
    this.available_games = [];
    this.available_games_change_callback = null;
    this.game = null;
    this.game_update_callback = null;

    this.socket = io();
    this.socket.on("list games", (games) => {
      this.available_games = games;
      if(this.available_games_change_callback !== null) {
        this.available_games_change_callback(this.available_games);
      }
    });
    this.socket.on("game update", (game) => {
      this.game = game;
      if(this.game_update_callback !== null) {
        this.game_update_callback(this.game);
      }
    });
  }
  create_game() {
    this.socket.emit("create game");
  }
  join_game(gameId: GameId) {
    this.socket.emit("join game", gameId);
  }
  leave_game() {
    this.socket.emit("leave game");
  }
  ready() {
    this.socket.emit("ready");
  }
  unready() {
    this.socket.emit("unready");
  }
  make_bet(card: Card) {
    this.socket.emit("make bet", card);
  }
  on_available_games_change(callback: AvailableGamesChangeCallback | null) {
    this.available_games_change_callback = callback;
  }
  on_game_update(callback: GameUpdateCallback | null) {
    this.game_update_callback = callback;
  }
}
