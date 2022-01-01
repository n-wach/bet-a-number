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

function newGameId(): GameId {
  return capitalize(randomAdjective()) + capitalize(randomNoun());
}

// from https://sashamaps.net/docs/resources/20-colors/
const colors: Color[] = [
  '#e6194B',
  '#3cb44b',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#469990',
  '#9A6324',
  '#800000',
  '#808000',
  '#000075',
  '#42d4f4',
  '#f032e6',
]

function newPointDeck(): CardStack {
  const stack: CardStack = [];
  for(let i = -5; i <= -1; i++) {
    stack.push(i);
  }
  for(let i = 1; i <= 10; i++) {
    stack.push(i);
  }
  return stack;
}

function newPlayerDeck(): CardStack {
  const stack: CardStack = [];
  for(let i = 1; i <= 15; i++) {
    stack.push(i);
  }
  return stack;
}

function newGame(): Game {
  return {
    id: newGameId(),
    state: GameState.WAITING,
    players: new Map<PlayerId, Player>(),
    current_round: null,
    previous_rounds: [],
    remaining_cards: newPointDeck()
  }
}

function newPlayer(id: PlayerId, game: ManagedGame): Player {
  return {
    id: id,
    gameId: game.id(),
    color: game.newPlayerColor(),
    ready: false,
    remaining_cards: newPlayerDeck(),
    won_rounds: [],
    total_score: 0,
  }
}

function getRoundWinner(round: Round): PlayerId | null {
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

class ManagedGame {
  static MAX_PLAYERS = 12;
  // manages a single game
  private readonly game: Game;
  private manager: GameManager;
  private autoplayTimeoutHandle: any;
  constructor(manager: GameManager, game: Game) {
    this.manager = manager;
    this.game = game;
    this.autoplayTimeoutHandle = null;
  }
  sendUpdate() {
    this.manager.sendGameUpdate(this.game);
  }
  addPlayer(player: Player) {
    this.game.players.set(player.id, player);
    this.sendUpdate();
  }
  deleteGame() {
    if(this.autoplayTimeoutHandle) {
      clearInterval(this.autoplayTimeoutHandle);
    }
    this.manager.closeGame(this.game);
    this.manager.sendAvailableGames();
  }
  removePlayer(player: Player) {
    this.game.players.delete(player.id);
    if(this.game.players.size == 0) {
      console.log("Deleting game with no players:", this.game.id);
      this.deleteGame();
    } else {
      this.sendUpdate();
      this.checkPlayerReadiness();
    }
  }
  playerReady(player: Player) {
    player.ready = true;
    this.sendUpdate();
    this.checkPlayerReadiness();
  }
  playerUnready(player: Player) {
    player.ready = false;
    this.sendUpdate();
  }
  playerMakeBet(player: Player, bet: Card) {
    if(this.game.state != GameState.PLAYING) {
      return;
    }
    if(!this.game.current_round) {
      return;
    }
    let round = this.game.current_round;
    round.bets.set(player.id, bet);

    if(round.bets.size == this.game.players.size) {
      // everyone has bet; next round.
      this.nextRound();
    } else {
      this.sendUpdate();
    }
  }
  scheduleAutoplay() {
    // schedule the next round to happen in 15 seconds.
    // if all players make bets beforehand, this will be cancelled.
    this.autoplayTimeoutHandle = setInterval(() => {
      console.debug("next round triggered from delay");
      this.nextRound();
    }, 15000);
  }
  clearAutoplay() {
    if(this.autoplayTimeoutHandle) {
      clearInterval(this.autoplayTimeoutHandle);
      this.autoplayTimeoutHandle = null;
    }
  }
  gameOver() {
    this.game.state = GameState.ENDED;
    if(this.game.current_round) {
      this.game.previous_rounds.push(this.game.current_round);
    }
    this.game.current_round = null;
    this.sendUpdate();
  }
  nextRound() {
    // cancel any pending move timer
    this.clearAutoplay();

    if(this.game.current_round === null) {
      console.error("Unexpected null current_round");
      return;
    }

    // process last round
    // make random bets for any player that didn't pick one
    this.game.players.forEach((player) => {
      let bet = this.game.current_round?.bets.get(player.id);
      if(bet === undefined) {
        // if player didn't place a bet: pick a random one.
        bet = player.remaining_cards[Math.floor(Math.random() * player.remaining_cards.length)];
        this.game.current_round?.bets.set(player.id, bet);
      }
    });

    // reward winner if exists
    const winnerId = getRoundWinner(this.game.current_round);
    if(winnerId) {
      const winner = this.game.players.get(winnerId);
      if(winner) {
        this.game.current_round.winner = winner.id;
        winner.total_score += sum(this.game.current_round.prize_pool);
        winner.won_rounds.push(this.game.current_round.id);
      }
    }

    // remove player bets
    this.game.players.forEach((player) => {
      let cards = player.remaining_cards;
      let bet = this.game.current_round?.bets.get(player.id);
      // everyone should have made a bet, this just makes typescript happy.
      // remove bet from player cards
      cards.splice(cards.indexOf(bet as number), 1);
    });

    if(this.game.remaining_cards.length == 0) {
      // no more rounds. game over
      this.gameOver();
      return;
    }

    // prepare next round
    let next_point = popRandomItem(this.game.remaining_cards);
    let new_round = {
      id: this.game.current_round.id + 1,
      bets: new Map<PlayerId, Card>(),
      prize_pool: [next_point],
      winner: null,
    }
    if(!winnerId) {
      // previous points copy over if nobody won
      new_round.prize_pool.push(...this.game.current_round.prize_pool);
    }

    this.game.previous_rounds.push(this.game.current_round);
    this.game.current_round = new_round;

    this.scheduleAutoplay();
    this.sendUpdate();
    // client expects the round to be processed/sent before "next round" is sent
    this.manager.sendNextRound(this);
  }
  checkPlayerReadiness() {
    if(this.game.state != GameState.WAITING) {
      // only care about games that are waiting
      return;
    }
    let allReady = true;
    this.game.players.forEach((player) => {
      if(!player.ready) {
        allReady = false;
      }
    });
    if(allReady) {
      this.start();
    }
  }
  start() {
    this.game.state = GameState.PLAYING;

    const point = popRandomItem(this.game.remaining_cards);

    this.game.current_round = {
      id: 0,
      bets: new Map(),
      prize_pool: [point],
      winner: null,
    }
    this.manager.sendAvailableGames();
    this.scheduleAutoplay();
    this.sendUpdate();
  }
  joinable(): boolean {
    return this.game.state == GameState.WAITING &&
        this.game.players.size <= ManagedGame.MAX_PLAYERS;
  }
  id(): string {
    return this.game.id;
  }
  newPlayerColor(): Color {
    for(let i = 0; i < colors.length; i++) {
      const color = colors[i];
      let alreadyUsed = false;
      this.game.players.forEach((player) => {
        if(player.color == color) alreadyUsed = true;
      });
      if(!alreadyUsed) return color;
    }
    return colors[Math.floor(Math.random() * colors.length)];
  }
}


export default class GameManager {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
  }

  private players: Map<PlayerId, Player> = new Map<PlayerId, Player>();
  getPlayer(socket: Socket): Player | null {
    let player = this.players.get(socket.id);
    if(!player) {
      return null;
    }
    return player;
  }

  private managedGames: Map<GameId, ManagedGame> = new Map<GameId, ManagedGame>();
  getGame(socket: Socket): ManagedGame | null {
    let player = this.getPlayer(socket);
    if(!player) {
      return null;
    }
    let game = this.managedGames.get(player.gameId);
    if(!game) {
      return null;
    }
    return game;
  }

  inGame(socket: Socket) {
    let player = this.players.get(socket.id);
    if(!player) {
      return false;
    }
    return this.managedGames.has(player.gameId);
  }
  socketConnect(socket: Socket) {
    socket.on("disconnect", this.socketDisconnect.bind(this, socket));
    socket.on("create game", this.socketCreateGame.bind(this, socket));
    socket.on("join game", this.socketJoinGame.bind(this, socket));
    socket.on("leave game", this.socketLeaveGame.bind(this, socket));
    socket.on("ready", this.socketReady.bind(this, socket));
    socket.on("unready", this.socketUnready.bind(this, socket));
    socket.on("make bet", this.socketMakeBet.bind(this, socket));

    socket.join("lobby");
    this.sendAvailableGames(socket);
  }
  socketDisconnect(socket: Socket) {
    if(this.inGame(socket)) {
      this.socketLeaveGame(socket);
    }
  }
  socketCreateGame(socket: Socket) {
    if(this.players.has(socket.id)) {
      console.error("Can't create a game while in another.");
      return;
    }
    const game = newGame();
    const managedGame = new ManagedGame(this, game);
    this.managedGames.set(game.id, managedGame);

    this.socketJoinGame(socket, game.id);

    this.sendAvailableGames();
  }
  socketJoinGame(socket: Socket, gameId: GameId) {
    if(this.inGame(socket)) {
      console.error("Can't join a game while in another.");
      return;
    }
    const game = this.managedGames.get(gameId);
    if(!game) {
      console.error(`Unknown game: ${gameId}`);
      return;
    }
    if(!game.joinable()) {
      console.error(`Attempted to join game that isn't joinable: ${gameId}`);
      return;
    }

    socket.leave("lobby");
    socket.join(game.id());
    const player = newPlayer(socket.id, game);
    this.players.set(player.id, player);
    game.addPlayer(player);
  }
  socketLeaveGame(socket: Socket) {
    const game = this.getGame(socket);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    const player = this.getPlayer(socket);
    if(!player) {
      console.error("No player found.");
      return;
    }

    game.removePlayer(player);

    this.players.delete(socket.id);
    socket.emit("game update", null); // reset client
    socket.leave(game.id());

    socket.join("lobby");
    this.sendAvailableGames(socket);
  }
  socketReady(socket: Socket) {
    const game = this.getGame(socket);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    const player = this.getPlayer(socket);
    if(!player) {
      console.error("No player found.");
      return;
    }

    game.playerReady(player);
  }
  socketUnready(socket: Socket) {
    const game = this.getGame(socket);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    const player = this.getPlayer(socket);
    if(!player) {
      console.error("No player found.");
      return;
    }

    game.playerUnready(player);
  }
  socketMakeBet(socket: Socket, bet: Card) {
    const game = this.getGame(socket);
    if(!game) {
      console.error("Player not in a valid game.");
      return;
    }
    const player = this.getPlayer(socket);
    if(!player) {
      console.error("No player found.");
      return;
    }
    if(player.remaining_cards.indexOf(bet) == -1) {
      console.error("Can't bet a card player doesn't have.");
      return;
    }

    game.playerMakeBet(player, bet);
  }
  sendGameUpdate(game: Game) {
    // SocketIO uses JSON, which doesn't support Maps.
    // We must convert to Array of [key, value] manually.

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
          if(playerId == player.id) {
            shownBet = bet;
          }
          clean_game.current_round.bets.push([playerId, shownBet]);
        });
      }
      // Hacky way to get player's socket.
      let playerSocket = this.io.sockets.sockets.get(player.id);
      playerSocket?.emit("game update", clean_game);
    });
  }
  sendAvailableGames(socket: Socket | null = null) {
    if(!socket) {
      // send to everyone in lobby
      socket = this.io.to("lobby") as unknown as Socket;
    }
    const joinableGameIds: GameId[] = [];
    this.managedGames.forEach((game) => {
      if(game.joinable()) {
        joinableGameIds.push(game.id());
      }
    });
    socket.emit("list games", joinableGameIds);
  }
  sendNextRound(game: ManagedGame) {
    this.io.to(game.id()).emit("next round");
  }
  closeGame(game: Game) {
    this.managedGames.delete(game.id);
  }
}

