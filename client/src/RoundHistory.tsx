import {Game, Player, Round} from "./shared";
import React from "react";

type RoundHistoryRowProps = {
    round: Round,
    game: Game,
}

class RoundHistoryRow extends React.Component<RoundHistoryRowProps> {
    getBets(): [Player, number, boolean][] {
        const bets: [Player, number, boolean][] = [];
        this.props.round.bets.forEach((bet, playerId) => {
            bets.push(
                [
                    this.props.game.players.get(playerId)!,
                    bet,
                    this.props.round.winner === playerId
                ]
            )
        })
        return bets;
    }
    render() {
        return (
            <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">{this.props.round.id + 1}</span>
                </td>
                { this.getBets().map(([player, bet, winner]) =>
                    <td className={"px-6 py-4 whitespace-nowrap" + (winner ? " font-extrabold underline" : "")}
                               style={ {color: player.color }}>
                        { bet }
                    </td>
                ) }
                <td className="px-6 py-4 whitespace-nowrap">
                    { this.props.round.prize_pool.map( (card, index) =>
                        <span className={card > 0 ? "text-amber-400" : "text-indigo-600"}>
                            { index > 0 && <span className={"text-gray-500"}> + </span> }
                            { card }
                        </span>
                    )}
                </td>
            </tr>
        );
    }
}


type RoundHistoryProps = {
    game: Game,
}

export default class RoundHistory extends React.Component<RoundHistoryProps> {
    getRounds(): Round[] {
        if(this.props.game.current_round) {
            return [...this.props.game.previous_rounds, this.props.game.current_round]
        }
        return this.props.game.previous_rounds;
    }
    render() {
        return (
            <div className="text-center">
                <div className="py-2 align-middle inline-block max-w-full w-[72rem] px-4">
                    <div className="shadow overflow-auto border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    colSpan={this.props.game.players.size}>
                                    Bids
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Prize
                                </th>
                            </tr>
                            </thead>
                            <tbody className="text-center bg-white divide-y divide-gray-200">
                                {this.getRounds().map((round) => <RoundHistoryRow round={round} game={this.props.game}/>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

