import GameClient from "./GameClient";
import {Card, Game, GameId, Player} from "./shared";
import React from "react";

type PlayerIconProps = {
  player: Player;
  game: Game;
}

class PlayerIcon extends React.Component<PlayerIconProps> {
  render() {
    const player = this.props.player;
    if(this.props.game.current_round?.bets.has(player.id)) {
      // player has made a bet
      return (
        <div className="inline-block rounded-md w-20 h-20 border-4 text-white" style={
          {
            backgroundColor: player.color,
            borderColor: player.color
          }
        }>
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      )
    }
    return (
        <div className="inline-block rounded-md w-20 h-20 border-4 text-white" style={
          {
            borderColor: player.color,
            color: player.color
          }
        }>
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
    )
  }
}

type BetAreaProps = {
  game: Game;
  player: Player | null;
  client: GameClient;
}

class BetAreaIcon extends React.Component<BetAreaProps> {
  static BETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  renderBet(bet: number) {
    const player = this.props.player;
    if(player && this.props.game.current_round?.bets.get(player.id) == bet) {
      // selected bet
      return (
          <div className="cursor-pointer inline-block rounded-md w-24 h-24 border-4 text-white" style={
            {
              backgroundColor: player.color,
              borderColor: player.color
            }
          }>
            <p>{ bet }</p>
            <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
            </svg>
          </div>
      )
    }
    if(player && player.remaining_cards.includes(bet)) {
      // available bet
      return (
        <div onClick={() => this.props.client.make_bet(bet)}
           className="cursor-pointer inline-block rounded-md w-24 h-24 border-4 hover:bg-gray-200" style={
             {
               borderColor: player.color,
               color: player.color
             }
           }>
          <p>{ bet }</p>
        </div>
      )
    }
    // unavailable bet
    return (
      <div className="cursor-not-allowed inline-block rounded-md w-24 h-24 border-4 border-gray-400 text-gray-400">
        <p>{ bet }</p>
        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24"
             stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
      </div>
    )
  }
  render() {
    return (
        <div className="inline-flex flex-wrap gap-2 text-center text-4xl">
          { BetAreaIcon.BETS.map((n) => this.renderBet(n))}
        </div>
    )
  }
}

type PlayingAreaProps = {
  client: GameClient;
  game: Game;
}

export default class PlayingArea extends React.Component<PlayingAreaProps> {
  render() {
    return (
        <div className="flex flex-col items-center justify-between text-center min-h-[70vh]">
          <div className="inline-flex flex-wrap gap-2 text-center">
            { this.props.client.get_other_players().map((player) =>
              <PlayerIcon player={player} game={this.props.game}/>
            )}
          </div>

          <div>
            <div>
              <span>Prize Pool:</span>
              <code>{ JSON.stringify(this.props.game.current_round?.prize_pool) }</code>
            </div>
            <div>
              <span>Remaining Time:</span>
              <span>TODO seconds</span>
            </div>
          </div>

          <div>
            <div>
              <span>Your bet:</span>
              <span>Your score: { this.props.client.get_this_player()?.total_score }</span>
            </div>
            <BetAreaIcon game={this.props.game} player={this.props.client.get_this_player()} client={this.props.client}/>
          </div>
        </div>
    );
  }
}
