import React from 'react';
import './App.css';
import GameClient from "./GameClient";
import {Game, GameId} from "./shared";

type AppState = {
  game: Game | null,
  available_games: GameId[];
}

export default class App extends React.Component<any, AppState> {
  private readonly client: GameClient;
  constructor(props: any) {
    super(props);
    this.state = {
      game: null,
      available_games: [],
    }
    this.client = new GameClient(
        games => this.setState({available_games: games}),
        game => this.setState({game: game})
    );
    console.log("Client:", this.client);

  }
  render() {
    return (
        <div className="App">
          {this.state.game ?
              <p>In game</p> :
              <p>
                In lobby. Available games:
                <ul>
                  {this.state.available_games.map((gameId) => <li>{gameId}</li>)}
                </ul>
              </p>}
        </div>
    );
  }
}

