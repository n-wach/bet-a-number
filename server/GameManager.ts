import {CardStack, Color, Game, GameId, GameState, Player, PlayerId, Round, RoundId} from "../client/src/shared";
import {Socket} from "socket.io";

export default class GameManager {
  private games: Map<GameId, Game> = new Map<GameId, Game>();
  private players: Map<string, Player> = new Map<string, Player>();
  player_connect(socket: Socket) {
    socket.on("disconnect", this.player_disconnect.bind(this, socket));
    socket.on("create game", this.player_create_game.bind(this, socket));
    socket.on("join game", this.player_join_game.bind(this, socket));
    socket.on("leave game", this.player_leave_game.bind(this, socket));
    socket.on("ready", this.player_ready.bind(this, socket));
    socket.on("unready", this.player_unready.bind(this, socket));
    socket.on("make bet", this.player_make_bet.bind(this, socket));

    this.send_available_games(socket, false);
  }
  player_disconnect(socket: Socket) {
    console.log("disconnect");
  }
  player_create_game(socket: Socket) {
    console.log("create game");
    const player: Player = {
      id: socket.id,
      color: {r: 1, g: 0, b: 0},
      ready: false,
      remaining_cards: null,
      won_rounds: null,
      total_score: null,
    };
    const game: Game = {
      id: "",
      state: GameState.WAITING,
      players: [player],
      current_round: null,
      previous_rounds: null,
      remaining_cards: null,
      remaining_prize_points: null,
    }
    this.games.set(game.id, game);

    this.send_available_games(socket, true);
  }
  player_join_game(socket: Socket, gameId: GameId) {
    console.log("join game", gameId);
  }
  player_leave_game(socket: Socket) {
    console.log("leave game");
  }
  player_ready(socket: Socket) {
    console.log("ready");
  }
  player_unready(socket: Socket) {
    console.log("unready");
  }
  player_make_bet(socket: Socket) {
    console.log("make bet");
  }
  send_game_update(socket: Socket, broadcastToAllPlayers: boolean = true) {
    console.log("send game update");
  }
  send_available_games(socket: Socket, broadcastToAllInLobby: boolean = true) {
    console.log("send available games");
  }
}

