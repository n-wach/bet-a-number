export type Card = number;
export type CardStack = Card[];

export type GameId = string;
export type PlayerId = string;
export type RoundId = number;

export type Color = string;

export type Round = {
  id: RoundId;
  bets: Map<PlayerId, Card>;
  prize_pool: CardStack;
  winner: null | PlayerId;
}

export type Player = {
  id: PlayerId;
  gameId: GameId;
  color: Color;
  ready: boolean;
  remaining_cards: CardStack;
  won_rounds: RoundId[];
  total_score: number;
}

export enum GameState {
  WAITING, // waiting for players to ready-up
  PLAYING, // game is in progress
  ENDED, // game is over, someone won
}

export type Game = {
  id: GameId;
  state: GameState;
  players: Map<PlayerId, Player>;
  current_round: Round | null;
  previous_rounds: Round[];
  remaining_cards: CardStack;
}
