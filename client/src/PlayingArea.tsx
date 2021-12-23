import GameClient from "./GameClient";
import {Game, GameId, Player} from "./shared";
import React from "react";
import './PlayingArea.css';

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
          <PlayerGrid {...this.props}/>
        </div>
    );
  }
}

function PlayerGrid(props: PlayingAreaProps) {
  return (<div className="Player-grid">
    {props.client.get_other_players().map((player) => {
      return <PlayerCard {...player}/>
    })}
  </div>);
}

function PlayerCard(props: Player) {
  return (<p style={ {color: props.color}}>■</p>)
}