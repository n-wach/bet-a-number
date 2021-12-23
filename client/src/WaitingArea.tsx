import GameClient from "./GameClient";
import {Game, GameId} from "./shared";
import React from "react";

type WaitingAreaProps = {
  client: GameClient;
  game: Game;
}

export default class WaitingArea extends React.Component<WaitingAreaProps> {
  constructor(props: any) {
    super(props);
  }
  toggleReady() {
    const player = this.props.client.get_this_player();
    if(player?.ready) {
      this.props.client.unready();
    } else {
      this.props.client.ready();
    }
  }
  getReadyStatus(): string {
    const player = this.props.client.get_this_player();
    if(!player) {
      return "Unknown";
    }
    if(player.ready) {
      return "Ready";
    } else {
      return "Not Ready";
    }
  }
  getThisPlayerColor() {
    const player = this.props.client.get_this_player();
    return player?.color || "#000000";
  }
  render() {
    return (
        <div className="WaitingArea">
          <p>
            Waiting for all players to be ready.
          </p>
          <p style={ { color: this.getThisPlayerColor() } }>You are
            <button onClick={() => this.toggleReady()}>{this.getReadyStatus()}</button>
          </p>
          { this.props.client.get_other_players().map((player) => {
            return <p style={ {color: player.color} }>■ is {player.ready ? "Ready" : "Not Ready"}</p>
          })}
        </div>
    );
  }
}
