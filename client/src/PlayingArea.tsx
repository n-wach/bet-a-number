import GameClient from "./GameClient";
import {Card, Game, GameId, Player, Round} from "./shared";
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
type PlayingAreaState = {
  display_bets: boolean;
  remaining_time: number;
}

export default class PlayingArea extends React.Component<PlayingAreaProps, PlayingAreaState> {
  private animateHandle: number | null;
  private timerHandle: number | null;
  constructor(props: PlayingAreaProps) {
    super(props);
    this.props.client.on_next_round((round) => {
      this.animate_round_advancement(round);
      this.setState({remaining_time: 14});
    });
    this.state = {
      display_bets: false,
      remaining_time: 14,
    };
    this.animateHandle = null;
    this.timerHandle = setInterval(() => {
      let new_time = 0;
      if(this.state.remaining_time > 0) {
        new_time = this.state.remaining_time - 1;
      }
      this.setState({remaining_time: new_time});
    }, 1000) as unknown as number;
  }
  animate_round_advancement(round: Round) {
    console.log("next round", round);
    if(this.animateHandle !== null) {
      clearTimeout(this.animateHandle);
    }
    this.setState({ display_bets: true });
    this.animateHandle = setTimeout(() => {
      this.setState({display_bets: false});
    }, 3000) as unknown as number;
  }
  render() {
    return (
        <div className="flex flex-col items-center justify-between text-center min-h-[70vh]">
          <div className="inline-flex flex-wrap gap-2 text-center">
            { this.props.client.get_other_players().map((player) =>
              <PlayerIcon player={player} game={this.props.game}/>
            )}
          </div>

          <div className="flex justify-between w-full">
            <div className="flex flex-col">
              <span>Prize Pool (TODO points):</span>
              <div className="inline-flex flex-wrap gap-2 text-center text-4xl w-full">
                { this.props.game.current_round?.prize_pool.map( (card) => {
                      if (card > 0) {
                        return <div
                            className="cursor-not-allowed inline-block rounded-md w-24 h-24 border-4 border-amber-400 text-amber-400">
                          <p>{card}</p>
                          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      } else {
                        return <div
                            className="cursor-not-allowed inline-block rounded-md w-24 h-24 border-4 border-indigo-600 text-indigo-600">
                          <p>{card}</p>
                          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      }
                    }
                )}
              </div>
              <span>Highest unique bet takes.</span>
            </div>
            { this.state.display_bets ?
                <div>
                  Bet Area
                  <div className="flex-wrap gap-2 text-center text-4xl w-full">
                    { Array.from(this.props.game.previous_rounds[this.props.game.previous_rounds.length - 1].bets.entries()).map(([key, value]) => {
                          let player = this.props.game.players.get(key) as Player;
                          let winner = this.props.game.previous_rounds[this.props.game.previous_rounds.length - 1].winner;
                          return <div className="cursor-not-allowed inline-block rounded-md w-24 h-24 border-4" style={
                            {
                              borderColor: player.color,
                              color: player.color
                            }
                          }>
                            <p>{value}</p>
                            { player.id == winner &&
                                <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                                </svg>
                            }
                          </div>
                        }
                    )}
                  </div>
                </div>
                :
                <div>
              <span>
                Remaining Time:
              </span>
                  <span>{this.state.remaining_time} seconds</span>
                </div>
                }

            <div>
              <div className="text-lg">
                <div
                    className="cursor-pointer inline-block rounded-md w-24 h-24 border-4 border-gray-400 text-gray-400 hover:bg-gray-200">
                  <p>Discard</p>
                  <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
              </div>
              <span>
                Click for History
              </span>
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
