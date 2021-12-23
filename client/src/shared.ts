export type Card = number;
export type CardStack = Card[];

export type GameId = string;
export type PlayerId = string;
export type RoundId = number;

export type Color = {
  r: number;
  g: number;
  b: number;
}

export type Round = {
  id: RoundId;
  bets: Map<PlayerId, Card>;
  prize_pool: CardStack;
  winner: null | PlayerId;
}

export type Player = {
  id: PlayerId;
  color: Color;
  ready: boolean;
  remaining_cards: CardStack | null;
  won_rounds: RoundId[] | null;
  total_score: number | null;
}

export enum GameState {
  WAITING, // waiting for players to ready-up
  PLAYING, // game is in progress
  ENDED, // game is over, someone won
}

export type Game = {
  id: GameId;
  state: GameState;
  players: Player[];
  current_round: Round | null;
  previous_rounds: Round[] | null;
  remaining_cards: CardStack | null;
  remaining_prize_points: number | null;
}
