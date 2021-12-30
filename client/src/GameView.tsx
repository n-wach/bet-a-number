import GameClient from "./GameClient";
import {Game, GameState} from "./shared";
import React from "react";
import WaitingArea from "./WaitingArea";
import PlayingArea from "./PlayingArea";
import GameOverArea from "./GameOverArea";

type GameViewProps = {
  client: GameClient;
  game: Game;
}

export default class GameView extends React.Component<GameViewProps> {
  getStatusString() {
    const status = this.props.game.state;
    if(status == GameState.WAITING) {
      return "Waiting for all players to be ready";
    }
    if(status == GameState.PLAYING) {
      if(!this.props.game.current_round) {
        return "Unknown round";
      }
      return `Round ${this.props.game.current_round?.id + 1} of 15`
    }
    if(status == GameState.ENDED) {
      return "Game over";
    }
  }
  render() {
    return (
        <div className="p-10 text-center">
          <div className="inline-flex flex-wrap gap-x-5 max-w-full w-[72rem]">
            <span className="text-xl font-semibold md:text-3xl">
              {this.props.game.id}
            </span>
            <span className="text-xl grow md:text-3xl text-left">
              {this.getStatusString()}
            </span>
            <a onClick={() => this.props.client.leave_game()}
              className="px-5 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 shadow">
              Leave Game
            </a>
          </div>

          { this.props.game.state == GameState.WAITING ?
              <WaitingArea client={this.props.client} game={this.props.game}/>: null
          }
          { this.props.game.state == GameState.PLAYING ?
              <PlayingArea client={this.props.client} game={this.props.game}/> : null
          }
          { this.props.game.state == GameState.ENDED ?
              <GameOverArea client={this.props.client} game={this.props.game}/> : null
          }
        </div>
    );
  }
}
