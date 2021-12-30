import GameClient from "./GameClient";
import {Game, GameId, Player} from "./shared";
import React from "react";

class PlayerSettings extends React.Component<any> {

}

type GameSettingsProps = {
  client: GameClient;
  game: Game;
}

class GameSettings extends React.Component<any> {

}

type PlayerRowProps = {
  client: GameClient;
  player: Player;
  is_me: boolean;
}

class PlayerRow extends React.Component<PlayerRowProps> {
  render() {
    return (
        <tr>
          <td className="px-6 py-4 whitespace-nowrap font-semibold" style={{"color": this.props.player.color}}>
            Player {this.props.player.id} { this.props.is_me ? "(You)" : null}
          </td>
          <td className="px-6 py-4 h-[75px] whitespace-nowrap">
            { this.props.is_me ?
                (this.props.player.ready ?
                  <a onClick={() => this.props.client.unready()}
                     className="inline-flex items-center justify-center px-10 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow"
                  >Ready</a> :
                  <a onClick={() => this.props.client.ready()}
                     className="inline-flex items-center justify-center px-10 py-2 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow"
                  >Not Ready</a>
                ) :
                (this.props.player.ready ?
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Ready
                  </span> :
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Not Ready
                  </span>
                )
            }
          </td>
        </tr>
    )
  }
}

type WaitingAreaProps = {
  client: GameClient;
  game: Game;
}

export default class WaitingArea extends React.Component<WaitingAreaProps> {
  render() {
    return (
        <div className="text-center py-10">
          <div className="py-2 align-middle inline-block max-w-full w-[72rem]">
            <div className="shadow overflow-auto border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
                </thead>
                <tbody className="text-left bg-white divide-y divide-gray-200">

                <PlayerRow client={this.props.client} player={this.props.client.get_this_player() as Player} is_me={true}/>

                { this.props.client.get_other_players().map((player =>
                  <PlayerRow client={this.props.client} player={player} is_me={false}/>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    );
  }
}
