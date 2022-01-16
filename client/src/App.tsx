import React from 'react';
import GameClient from "./GameClient";
import {AvailableGame, Game, GameId} from "./shared";
import Lobby from "./Lobby";
import GameView from "./GameView";

type AppState = {
  game: Game | null,
  available_games: AvailableGame[],
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
        <div className="py-10 text-gray-900">
          <h1 className="text-4xl text-center font font-extrabold tracking-tight sm:text-6xl">
            Bet a Number!
          </h1>
          {this.state.game ?
              <GameView client={this.client} game={this.state.game}/> :
              <Lobby client={this.client} games={this.state.available_games}/>
          }
        </div>
    );
  }
}

