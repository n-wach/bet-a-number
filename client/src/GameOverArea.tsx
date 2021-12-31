import GameClient from "./GameClient";
import {Game, GameId} from "./shared";
import React from "react";

type GameOverAreaProps = {
  client: GameClient;
  game: Game;
}

export default class GameOverArea extends React.Component<GameOverAreaProps> {
  render() {
    return (
        <div className="text-2xl p-10">
          <p style={ {color: this.props.client.get_this_player()?.color}}>Player {this.props.client.get_this_player()?.id} (You) had {this.props.client.get_this_player()?.total_score} points</p>
          {
            this.props.client.get_other_players().map((player) => {
              return <p style={ {color: player.color}}>Player {player.id} had {player.total_score} points</p>
            })
          }
        </div>
    );
  }
}
