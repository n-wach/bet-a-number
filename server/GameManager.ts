import {CardStack, Color, Game, GameId, GameState, Player, PlayerId} from "../client/src/shared";
import {Socket} from "socket.io";
import {randomAdjective, randomNoun} from "./namer";

function capitalize(s: string): string {
  if(s.length == 0) {
    return s;
  }
  return s[0].toUpperCase() + s.slice(1);
}

function new_game_id(): GameId {
  return capitalize(randomAdjective()) + capitalize(randomNoun());
}

// from https://sashamaps.net/docs/resources/20-colors/
const colors: Color[] = [
  '#e6194B',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
  '#fabed4',
  '#469990',
  '#dcbeff',
  '#9A6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#a9a9a9',
  '#ffffff',
  '#000000',
]

function new_player_color(game: Game): Color {
  return colors[game.players.length];
}

function new_point_deck(): CardStack {
  const stack: CardStack = [];
  for(let i = -5; i <= -1; i++) {
    stack.push(i);
  }
  for(let i = 1; i <= 10; i++) {
    stack.push(i);
  }
  return stack;
}

function new_player_deck(): CardStack {
  const stack: CardStack = [];
  for(let i = 1; i <= 15; i++) {
    stack.push(i);
  }
  return stack;
}

function new_game(): Game {
  const point_deck = new_point_deck();
  const total_points = point_deck.reduce((p, c) => p + c);
  return {
    id: new_game_id(),
    state: GameState.WAITING,
    players: [],
    current_round: null,
    previous_rounds: [],
    remaining_cards: point_deck,
    remaining_prize_points: total_points,
  }
}

function new_player(id: PlayerId, game: Game): Player {
  return {
    id: id,
    gameId: game.id,
    color: new_player_color(game),
    ready: false,
    remaining_cards: new_player_deck(),
    won_rounds: [],
    total_score: 0,
  }
}

function start_playing(game: Game) {
  game.state = GameState.PLAYING;
  // init everything.
}

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

    socket.join("lobby");
    this.send_available_games(socket, false);
  }
  player_disconnect(socket: Socket) {
    console.log("disconnect");
    if(this.players.has(socket.id)) {
      this.player_leave_game(socket);
    }
  }
  player_create_game(socket: Socket) {
    console.log("create game");
    if(this.players.has(socket.id)) {
      console.error("Can't create a game while in another.");
      return;
    }
    const game = new_game();
    this.games.set(game.id, game);

    this.player_join_game(socket, game.id);

    this.send_available_games(socket, true);
  }
  player_join_game(socket: Socket, gameId: GameId) {
    console.log("join game", gameId);
    const game = this.games.get(gameId);
    if(!game) {
      console.error(`Unknown game: ${gameId}`);
      return;
    }
    if(game.state != GameState.WAITING) {
      console.error(`Attempted to join game that wasn't waiting: ${gameId}`);
      return;
    }

    socket.leave("lobby");
    socket.join(game.id);
    const player = new_player(socket.id, game);
    this.players.set(socket.id, player);
    game.players.push(player);
    this.send_game_update(socket, game);
  }
  player_leave_game(socket: Socket) {
    console.log("leave game");
    const player = this.players.get(socket.id);
    if(!player) {
      console.error("Can't leave a game when not in one.");
      return;
    }
    const game = this.games.get(player.gameId);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }

    game.players = game.players.filter((value) => value !== player);
    if(game.players.length === 0) {
      console.log("Deleting game with no players:", game.id);
      this.games.delete(game.id);
    }

    this.players.delete(socket.id);
    socket.leave(game.id);
    this.send_game_update(socket, game);

    socket.join("lobby");
    this.send_available_games(socket, false);
  }
  player_ready(socket: Socket) {
    console.log("ready");
    const player = this.players.get(socket.id);
    if(!player) {
      console.error("Can't ready when not in a game.");
      return;
    }
    const game = this.games.get(player.gameId);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    if(game.state != GameState.WAITING) {
      console.error("Can only ready in waiting state.");
      return;
    }

    player.ready = true;
    if(game.players.every((player) => player.ready)) {
      start_playing(game);
    }

    this.send_game_update(socket, game);
  }
  player_unready(socket: Socket) {
    console.log("unready");
    const player = this.players.get(socket.id);
    if(!player) {
      console.error("Can't unready when not in a game.");
      return;
    }
    const game = this.games.get(player.gameId);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    if(game.state != GameState.WAITING) {
      console.error("Can only unready in waiting state.");
      return;
    }

    player.ready = false;

    this.send_game_update(socket, game);
  }
  player_make_bet(socket: Socket) {
    console.log("make bet");
    // game logic.
  }
  send_game_update(socket: Socket, game: Game, broadcastToAllPlayers: boolean = true) {
    console.log("send game update");
    if(broadcastToAllPlayers) {
      socket.to(game.id).emit("game update", game);
    }
    socket.emit("game update", game);
  }
  send_available_games(socket: Socket, broadcastToAllInLobby: boolean = true) {
    console.log("send available games");
    const waitingGameIds: GameId[] = [];
    this.games.forEach((game) => {
      if(game.state == GameState.WAITING) {
        waitingGameIds.push(game.id);
      }
    });
    console.log("waiting games:", waitingGameIds);
    if(broadcastToAllInLobby) {
      socket.to("lobby").emit("list games", waitingGameIds);
    }
    socket.emit("list games", waitingGameIds);
  }
}

