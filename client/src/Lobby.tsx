import React from 'react';
import './App.css';
import GameClient from "./GameClient";
import {GameId} from "./shared";

type LobbyProps = {
  client: GameClient;
  games: GameId[];
}

export default class Lobby extends React.Component<LobbyProps> {
  constructor(props: any) {
    super(props);
  }
  render() {
    return (
        <div className="Lobby">
          <p>
            In lobby.
          </p>
          <div>
            <button onClick={() => this.props.client.create_game()}>
              Create game
            </button>
          </div>
          {this.props.games.length == 0 ?
              <p>There are no existing games.</p> :
              <p>Or join an existing game:</p>
          }
          {this.props.games.map((gameId) =>
              <div>
                <button onClick={() => this.props.client.join_game(gameId)}>{gameId}</button>
              </div>
          )}
        </div>
    );
  }
}

