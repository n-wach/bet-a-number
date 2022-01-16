import {io, Socket} from "socket.io-client";
import {AvailableGame, Card, Game, GameId, Player, Round} from "./shared";

type AvailableGamesChangeCallback = (games: AvailableGame[]) => any;
type GameUpdateCallback = (game: Game | null) => any;
type NextRoundCallback = (last_round: Round) => any;

export default class GameClient {
  private socket: Socket;
  private available_games: AvailableGame[];
  private available_games_change_callback: AvailableGamesChangeCallback | null;
  private game: Game | null;
  private game_update_callback: GameUpdateCallback | null;
  private next_round_callback: NextRoundCallback | null;

  constructor(available_games_change_callback: AvailableGamesChangeCallback | null = null,
              game_update_callback: GameUpdateCallback | null = null,
              next_round_callback: NextRoundCallback | null = null) {
    this.available_games = [];
    this.available_games_change_callback = available_games_change_callback;
    this.game = null;
    this.game_update_callback = game_update_callback;
    this.next_round_callback = next_round_callback;

    this.socket = io({
      path: window.location.pathname + "socket.io",
    });
    this.socket.on("list games", (games) => {
      this.available_games = games;
      if(this.available_games_change_callback !== null) {
        this.available_games_change_callback(this.available_games);
      }
    });
    this.socket.on("game update", (game) => {
      // Map is not serializable over socket io, so we must convert
      // from Object into Map manually... ugh.
      if(game !== null) {
        game.players = new Map(game.players);
        for(let round of game.previous_rounds) {
          round.bets = new Map(round.bets);
        }
        if(game.current_round) {
          game.current_round.bets = new Map(game.current_round.bets);
        }
      }
      this.game = game;
      if(this.game_update_callback !== null) {
        this.game_update_callback(this.game);
      }
    });
    this.socket.on("next round", (last_round) => {
      if(this.next_round_callback) {
        this.next_round_callback(last_round);
      }
    })
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
  on_next_round(callback: NextRoundCallback | null) {
    this.next_round_callback = callback;
  }
  get_this_player(): Player | null {
    return this.game?.players.get(this.socket.id) || null;
  }
  get_other_players(): Player[] {
    const other_players: Player[] = [];
    this.game?.players.forEach((player, playerId) => {
      if(playerId !== this.socket.id) {
        other_players.push(player);
      }
    });
    return other_players;
  }
}
