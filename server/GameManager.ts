import {Card, CardStack, Color, Game, GameId, GameState, Player, PlayerId, Round} from "../client/src/shared";
import {Server, Socket} from "socket.io";
import {randomAdjective, randomNoun} from "./namer";

function popRandomItem<T>(array: T[]): T {
  const i = Math.floor(Math.random() * array.length);
  return array.splice(i, 1)[0];
}

function sum(array: number[]): number {
  return array.reduce((p, c) => p + c);
}

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
  return colors[game.players.size];
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
  return {
    id: new_game_id(),
    state: GameState.WAITING,
    players: new Map<PlayerId, Player>(),
    current_round: null,
    previous_rounds: [],
    remaining_cards: new_point_deck(),
    move_timer: null,
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

function get_round_winner(round: Round): PlayerId | null {
  let bets = Array.from(round.bets.entries()); // [playerId, bet]

  // put players into buckets by their bets
  let sameBetters = new Map<number, PlayerId[]>();
  for(let [playerId, bet] of bets) {
    if(!sameBetters.has(bet)) sameBetters.set(bet, []);

    let playersWithThisBet = sameBetters.get(bet);
    playersWithThisBet?.push(playerId);
  }

  // remove any bucket that doesn't have 1 player (ties)
  for(let [playerId, bet] of bets) {
    if(sameBetters.get(bet)?.length !== 1) {
      sameBetters.delete(bet);
    }
  }
  let uniqueBets = Array.from(sameBetters.entries()); // [bet, [playerId]]

  // if no unique bets, it's all a tie and nobody wins.
  if(uniqueBets.length == 0) {
    return null;
  }

  // otherwise, sort unique bets by card value. ascending order
  uniqueBets.sort((a, b) => a[0] - b[0]);

  let prize_value = sum(round.prize_pool);
  if(prize_value > 0) {
    // pick highest
    return uniqueBets[uniqueBets.length - 1][1][0];
  } else {
    // pick lowest
    return uniqueBets[0][1][0];
  }
}


export default class GameManager {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
  }

  private games: Map<GameId, Game> = new Map<GameId, Game>();
  private players: Map<PlayerId, Player> = new Map<PlayerId, Player>();
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
    this.players.set(player.id, player);
    game.players.set(player.id, player);
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

    game.players.delete(player.id);
    if(game.players.size === 0) {
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

    let all_ready = true;
    game.players.forEach((player) => {
      if(!player.ready) {
        all_ready = false;
      }
    });
    if(all_ready) {
      this.start_playing(socket, game);
      this.send_available_games(socket, true);
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
  player_make_bet(socket: Socket, bet: Card) {
    console.log("make bet");
    const player = this.players.get(socket.id);
    if(!player) {
      console.error("Can't bet when not in a game.");
      return;
    }
    const game = this.games.get(player.gameId);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    if(!game.current_round) {
      console.error("No current round in game.");
      return;
    }
    if(player.remaining_cards.indexOf(bet) == -1) {
      console.error("Can't bet a card player doesn't have.");
      return;
    }
    game.current_round.bets.set(player.id, bet);

    if(game.current_round.bets.size == game.players.size) {
      // everyone has bet; next round.
      this.next_round(socket, game);
    }

    this.send_game_update(socket, game);
  }
  send_game_update(socket: Socket, game: Game) {
    console.log("send game update");

    // SocketIO uses JSON, which doesn't support Maps.
    // We must convert to Array of [key, value] manually.

    // Before JSONing, remove move_timer (circular structure).
    const move_timer = game.move_timer;
    game.move_timer = null;

    // We also want to hide current bets by mapping the bets of other players to -1.

    // Start with a deep clone of the game.
    let clean_game: any = JSON.parse(JSON.stringify(game));

    // Set players
    clean_game.players = Array.from(game.players.entries());

    // Set previous round bets
    for(let i = 0; i < game.previous_rounds.length; i++) {
      const round = game.previous_rounds[i];
      clean_game.previous_rounds[i].bets = Array.from(round.bets.entries());
    }

    // Revealed bets need to be tailored to each player before sending.
    game.players.forEach((player) => {
      // Set current round bets
      if(game.current_round) {
        clean_game.current_round.bets = [];
        game.current_round.bets.forEach((bet, playerId) => {
          let shownBet = -1;
          if(playerId == socket.id) {
            shownBet = bet;
          }
          clean_game.current_round.bets.push([playerId, shownBet]);
        });
      }
      // Hacky way to get player's socket.
      let playerSocket = this.io.sockets.sockets.get(player.id);
      playerSocket?.emit("game update", clean_game);
    });

    // restore move_timer
    game.move_timer = move_timer;
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
  next_round(socket: Socket, game: Game) {
    // cancel any pending move timer
    if(game.move_timer) clearInterval(game.move_timer);

    if(game.current_round === null) {
      console.error("Unexpected null current_round");
      return;
    }

    // process last round
    // make random bets for any player that didn't pick one
    game.players.forEach((player) => {
      let bet = game.current_round?.bets.get(player.id);
      if(bet === undefined) {
        // if player didn't place a bet: pick a random one.
        bet = player.remaining_cards[Math.floor(Math.random() * player.remaining_cards.length)];
        game.current_round?.bets.set(player.id, bet);
      }
    });

    // reward winner if exists
    const winnerId = get_round_winner(game.current_round);
    if(winnerId) {
      const winner = game.players.get(winnerId);
      if(winner) {
        game.current_round.winner = winner.id;
        winner.total_score += sum(game.current_round.prize_pool);
        winner.won_rounds.push(game.current_round.id);
      }
    }

    // remove player bets
    game.players.forEach((player) => {
      let cards = player.remaining_cards;
      let bet = game.current_round?.bets.get(player.id);
      if(bet === undefined) return; // everyone should have made a bet, this just makes typescript happy.
      // remove bet from player cards
      cards.splice(cards.indexOf(bet), 1);
    });

    if(game.remaining_cards.length == 0) {
      // no more rounds. game over
      game.state = GameState.ENDED;
      if(game.current_round) {
        game.previous_rounds.push(game.current_round);
      }
      game.current_round = null;
      return;
    }

    // prepare next round
    let next_point = popRandomItem(game.remaining_cards);
    let new_round = {
      id: game.current_round.id + 1,
      bets: new Map<PlayerId, Card>(),
      prize_pool: [next_point],
      winner: null,
    }
    if(!winnerId) {
      // previous points copy over if nobody won
      new_round.prize_pool.push(...game.current_round.prize_pool);
    }

    game.previous_rounds.push(game.current_round);
    game.current_round = new_round;

    // schedule the next round to happen in 15 seconds.
    // if all players make bets beforehand, this will be cancelled.
    game.move_timer = setInterval(() => {
      console.log("next round triggered from delay");
      this.next_round(socket, game);
      this.send_game_update(socket, game);
    }, 15000);
  }

  start_playing(socket: Socket, game: Game) {
    game.state = GameState.PLAYING;

    const point = popRandomItem(game.remaining_cards);

    game.current_round = {
      id: 0,
      bets: new Map(),
      prize_pool: [point],
      winner: null,
    }

    // schedule the next round to happen in 15 seconds.
    // if all players make bets beforehand, this will be cancelled.
    game.move_timer = setInterval(() => {
      console.log("next round triggered from delay");
      this.next_round(socket, game);
      this.send_game_update(socket, game);
    }, 15000);
  }
}

