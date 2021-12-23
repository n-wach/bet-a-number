import GameClient from "./GameClient";
import {Game, GameId} from "./shared";
import React from "react";

type PlayingAreaProps = {
  client: GameClient;
  game: Game;
}

export default class PlayingArea extends React.Component<PlayingAreaProps> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
        <div className="PlayingArea">
          <p>
            In game.
          </p>
          <code>
            {JSON.stringify(this.props.game, undefined, 1)}
          </code>
        </div>
    );
  }
}
