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
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
        <div className="GameViewProps">
          <h1>
            {this.props.game.id}
          </h1>
          <p>
            Playing with {this.props.game.players.size} player{this.props.game.players.size > 1 ? "s" : ""}.
          </p>
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
