import GameClient from "./GameClient";
import {Card, Game, GameId} from "./shared";
import React from "react";

type PlayingAreaProps = {
  client: GameClient;
  game: Game;
}

export default class PlayingArea extends React.Component<PlayingAreaProps> {
  constructor(props: any) {
    super(props);
  }
  getPlayerBet(): Card | undefined {
    const id = this.props.client.get_this_player()?.id;
    if(!id) return -1;
    const bet = this.props.game.current_round?.bets.get(id);
    if(!bet) return -1;
    return bet;
  }
  render() {
    return (
        <div className="PlayingArea">
          <p>
            In game.
          </p>
          <p>
            Current prize pool: <code>{ JSON.stringify(this.props.game.current_round?.prize_pool) }</code>
          </p>
          <p>
            { this.props.game.current_round?.bets.size } of { this.props.game.players.size } players have placed bets.
          </p>
          <p>
            Your score is { this.props.client.get_this_player()?.total_score }.
          </p>
          <div>
            { this.props.client.get_this_player()?.remaining_cards.map((card) => {
              return <button
                  style={ { color: card == this.getPlayerBet() ?
                        this.props.client.get_this_player()?.color : "currentcolor" } }
                  onClick={() => this.props.client.make_bet(card)}
              >
                {card}
              </button>
            }) }
          </div>
        </div>
    );
  }
}
