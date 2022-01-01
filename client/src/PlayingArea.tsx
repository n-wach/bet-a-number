import GameClient from "./GameClient";
import {Game, Player, Round} from "./shared";
import React, {CSSProperties} from "react";
import {
  CheckIcon,
  DotsHorizontalIcon,
  EmojiHappyIcon,
  EmojiSadIcon,
  SaveIcon
} from "@heroicons/react/outline";
import {StarIcon} from "@heroicons/react/solid";

type CardIconProps = {
  color: string;
  icon: ((props: React.ComponentProps<'svg'>) => JSX.Element) | undefined;
  filled: boolean;
  text: string | undefined;
  className: string | undefined; // custom styling
  clickable: boolean; // cursor and bg on hover
  onClick: (() => void) | undefined;
}

class CardIcon extends React.Component<CardIconProps> {
  render() {
    let classes = ["inline-block", "rounded-md", "w-24", "h-24", "border-4"];
    let style: CSSProperties = {};

    let colorIsClass = this.props.color.includes("-");

    if(colorIsClass) {
      classes.push(`border-${this.props.color}`);
    } else {
      style.borderColor = this.props.color;
    }

    if(this.props.filled) {
      if(colorIsClass) {
        classes.push(`bg-${this.props.color}`);
      } else {
        style.backgroundColor = this.props.color;
      }
      classes.push('text-white');
    } else {
      if(colorIsClass) {
        classes.push(`text-${this.props.color}`);
      } else {
        style.color = this.props.color;
      }
    }

    if(this.props.clickable) {
      classes.push("hover:bg-gray-200");
      classes.push("cursor-pointer");
    } else {
      classes.push("cursor-not-allowed");
    }

    if(this.props.className) {
      classes.push(...this.props.className.split(' '));
    }

    let iconClasses = ['inline-block', 'h-10', 'w-10'];

    return (
        <div onClick={this.props.onClick} className={classes.join(' ')} style={ style }>
          { this.props.text && <p>{ this.props.text }</p>}
          { this.props.icon && this.props.icon({className: iconClasses.join(' ')}) }
        </div>
    )
  }
}

class IconShelf extends React.Component {
  render() {
    return (
        <div className="flex flex-wrap gap-2 text-center text-4xl">
          { this.props.children }
        </div>
    )
  }
}

type PlayerIconProps = {
  player: Player;
  game: Game;
}

class PlayerIcon extends React.Component<PlayerIconProps> {
  render() {
    const player = this.props.player;
    const madeBet = !!this.props.game.current_round?.bets.has(player.id);
    return <CardIcon color={player.color} icon={madeBet ? CheckIcon : DotsHorizontalIcon }
                     filled={madeBet} className={undefined}
                     clickable={false} onClick={undefined} text={undefined}/>;
  }
}

type PrizeIconProps = {
  value: number;
}

class PrizeIcon extends React.Component<PrizeIconProps> {
  render() {
    let positive = this.props.value > 0;
    return <CardIcon color={positive ? "amber-400" : "indigo-600" }
                     icon={positive ? EmojiHappyIcon : EmojiSadIcon }
                     filled={false} className={undefined}
                     clickable={false} onClick={undefined} text={this.props.value.toString()}/>;
  }
}

type BetIconProps = {
  value: number;
  client: GameClient;
  game: Game;
  player: Player;
}

class BetIcon extends React.Component<BetIconProps> {
  render() {
    let player = this.props.player;
    let roundBets = this.props.game.current_round?.bets || new Map();
    let value = this.props.value;
    if(value == roundBets.get(player.id)) {
      // selected bet
      return <CardIcon color={this.props.player.color} icon={CheckIcon} filled={true}
                       text={value.toString()} clickable={false} onClick={undefined} className={undefined}/>;
    }
    if(player.remaining_cards.includes(value)) {
      // available bet
      return <CardIcon color={this.props.player.color} icon={undefined} filled={false}
                       text={value.toString()} clickable={true}
                       onClick={() => {this.props.client.make_bet(value)}} className={undefined}/>;
    } else {
      // previously made bet
      return <CardIcon color={"gray-400"} icon={CheckIcon} filled={false} text={value.toString()} clickable={false} onClick={undefined} className={undefined}/>
    }
  }
}

type BetAreaProps = {
  game: Game;
  player: Player;
  client: GameClient;
}

class BetAreaIcon extends React.Component<BetAreaProps> {
  static BETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  render() {
    return (
        <IconShelf>
          { BetAreaIcon.BETS.map((n) =>
              <BetIcon value={n} client={this.props.client} game={this.props.game} player={this.props.player}/>
          )}
        </IconShelf>
    )
  }
}

type PlayingAreaProps = {
  client: GameClient;
  game: Game;
}
type PlayingAreaState = {
  display_bets: boolean;
  remaining_time: number;
}

export default class PlayingArea extends React.Component<PlayingAreaProps, PlayingAreaState> {
  private animateHandle: number | null;
  private timerHandle: number | null;
  constructor(props: PlayingAreaProps) {
    super(props);
    this.props.client.on_next_round((round) => {
      this.animate_round_advancement(round);
      this.setState({remaining_time: 14});
    });
    this.state = {
      display_bets: false,
      remaining_time: 14,
    };
    this.animateHandle = null;
    this.timerHandle = setInterval(() => {
      let new_time = 0;
      if(this.state.remaining_time > 0) {
        new_time = this.state.remaining_time - 1;
      }
      this.setState({remaining_time: new_time});
    }, 1000) as unknown as number;
  }
  animate_round_advancement(round: Round) {
    console.log("next round", round);
    if(this.animateHandle !== null) {
      clearTimeout(this.animateHandle);
    }
    this.setState({ display_bets: true });
    this.animateHandle = setTimeout(() => {
      this.setState({display_bets: false});
    }, 3000) as unknown as number;
  }
  render() {
    return (
        <div className="flex flex-col items-center justify-between text-center min-h-[70vh]">
          <IconShelf>
            { this.props.client.get_other_players().map((player) =>
                <PlayerIcon player={player} game={this.props.game}/>
            )}
          </IconShelf>

          <div className="flex justify-between w-full">
            <div className="flex flex-col">
              <span>Prize Pool (TODO points):</span>
              <IconShelf>
                { this.props.game.current_round?.prize_pool.map((card) => {
                  return <PrizeIcon value={card}/>;
                })}
              </IconShelf>
              <span>Highest unique bet takes.</span>
            </div>
            { this.state.display_bets ?
                <div>
                  Bet Area
                  <IconShelf>
                    { Array.from(this.props.game.previous_rounds[this.props.game.previous_rounds.length - 1].bets.entries()).map(([key, value]) => {
                          let player = this.props.game.players.get(key) as Player;
                          let winner = this.props.game.previous_rounds[this.props.game.previous_rounds.length - 1].winner;
                          return <CardIcon color={player.color} icon={player.id == winner ? StarIcon : undefined}
                                           filled={player.id == winner} text={value.toString()} clickable={false}
                                           onClick={undefined} className={undefined}/>
                        }
                    )}
                  </IconShelf>
                </div>
                :
                <div>
                  <span>
                    Remaining Time:
                  </span>
                  <span>{this.state.remaining_time} seconds</span>
                </div>
            }
            <div>
              <CardIcon color={"gray-400"} icon={SaveIcon} filled={false} text={"Discard"}
                        clickable={true} onClick={() => alert("TODO")} className={"text-lg"}/>
              <span>
                Click for History
              </span>
            </div>
          </div>

          <div>
            <div>
              <span>Your bet:</span>
              <span>Your score: { this.props.client.get_this_player()?.total_score }</span>
            </div>
            {this.props.client.get_this_player() && <BetAreaIcon game={this.props.game} player={this.props.client.get_this_player() as Player} client={this.props.client}/> }
          </div>
        </div>
    );
  }
}
