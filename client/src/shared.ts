export type Card = number;
export type CardStack = Card[];

export type GameId = string;
export type PlayerId = number;
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
  remaining_cards: CardStack;
  won_rounds: RoundId[];
  total_score: number;
  ready: boolean;
}

export enum GameState {
  WAITING, // waiting for players to ready-up
  PLAYING, // game is in progress
  ENDED, // game is over, someone won
}

export type Game = {
  id: GameId;
  previous_rounds: Round[];
  current_round: Round;
  remaining_cards: CardStack;
  remaining_prize_points: number;
  players: Player[];
  state: GameState;
}
