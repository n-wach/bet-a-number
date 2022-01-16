import React from 'react';
import GameClient from "./GameClient";
import {GameId} from "./shared";

type HowToPlayProps = {
  on_close: () => any;
}

class HowToPlay extends React.Component<HowToPlayProps> {
  render() {
    return (
        <div className="space-y-10 text-center pt-10">
          <div>
            <button onClick={() => this.props.on_close()}
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              Close
            </button>
          </div>

          <div className="py-2 align-middle inline-block max-w-full w-[48rem] px-4 text-left space-y-5">
            <p>
              A basic game consists of <code>15</code> rounds, and at least <code>2</code> players.
              Each player is given <code>15</code> numbers (from <code>1</code> to <code>15</code>)
              they can use to bid in a round. Each number can only be used once.
            </p>
            <p>
              In each round, players are bidding for some number of prize points.
              The deck of prize cards contains the values from <code>1</code> to <code>10</code>,
              and <code>-1</code> to <code>-5</code>.
              A random card is picked and revealed at the start of each round.
            </p>
            <p>
              In each round, players must pick a bid to place for the current prize points.
              Once all players have placed a bid, the bids are revealed. If you don't pick a
              bid within 30 seconds, a random bet will be made for you.
            </p>
            <p>
              If the prize is positive, the player with the highest unique bid takes the points. If negative, the player
              with the lowest unique bid takes. If there are no unique bids (everyone ties), the bids are
              discarded as usual, and an additional prize card is revealed. In the next round,
              players are betting for the combined value of both cards.
            </p>
            <p>
              After all 15 rounds, the player with the most prize points wins.
            </p>
          </div>

          <div className={"lg:hidden"}>
            <button onClick={() => this.props.on_close()}
                    className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              Close
            </button>
          </div>
        </div>
  );
  }
}

type LobbyProps = {
  client: GameClient;
  games: GameId[];
}

type LobbyState = {
  how_to_play: boolean,
}

export default class Lobby extends React.Component<LobbyProps, LobbyState> {
  constructor(props: LobbyProps) {
    super(props);
    this.state = {
      how_to_play: false,
    }
  }
  render() {
    if(this.state.how_to_play) {
      return <HowToPlay on_close={() => this.setState({how_to_play: false})}/>;
    }
    return (
        <div className="space-y-10">
          <div className="text-center space-y-10 space-x-8">
            <button onClick={() => this.setState({how_to_play: true})}
               className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              How to Play
            </button>
            <button onClick={() => this.props.client.create_game()}
               className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              Create a Game
            </button>
          </div>

          <div className="text-center">
            <h3 className="text-lg">
              Or join an existing game:
            </h3>
            <div className="py-2 align-middle inline-block max-w-full w-[72rem] px-4">
              <div className="shadow overflow-auto border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Players
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Join</span>
                    </th>
                  </tr>
                  </thead>
                  <tbody className="text-left bg-white divide-y divide-gray-200">

                  {this.props.games.map((gameId) =>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold">{gameId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          TODO
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Waiting for Players...
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          <a onClick={() => this.props.client.join_game(gameId)}
                             className="inline-flex items-center justify-center px-10 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow">
                            Join
                          </a>
                        </td>
                      </tr>
                  )}
                  {this.props.games.length == 0 &&
                      <td colSpan={4} className="w-full h-full text-center p-20 bg-gray-50">
                        There are no games waiting for players.
                      </td>
                  }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
    );
  }
}

