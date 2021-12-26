import React from 'react';
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
        <div className="space-y-10">
          <div className="text-center space-y-10 space-x-8">
            <a onClick={() => alert("You'll figure it out...")}
               className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              How to Play
            </a>
            <a onClick={() => this.props.client.create_game()}
               className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow">
              Create a Game
            </a>
          </div>

          <div className="text-center">
            <h3 className="text-lg">
              Or join an existing game:
            </h3>
            <div className="py-2 align-middle inline-block max-w-full w-1/2 sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
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

