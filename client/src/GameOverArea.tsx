import GameClient from "./GameClient";
import {Game, GameId} from "./shared";
import React from "react";

type GameOverAreaProps = {
  client: GameClient;
  game: Game;
}

export default class GameOverArea extends React.Component<GameOverAreaProps> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
        <div className="GameOverArea">

        </div>
    );
  }
}
