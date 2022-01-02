import GameClient from "./GameClient";
import {Card, Game, Player, PlayerId, Round} from "./shared";
import React, {CSSProperties, RefObject} from "react";
import {
  CheckIcon,
  DotsHorizontalIcon,
  EmojiHappyIcon,
  EmojiSadIcon,
  SaveIcon
} from "@heroicons/react/outline";
import {StarIcon} from "@heroicons/react/solid";
import {CSSTransition, Transition, TransitionGroup} from 'react-transition-group'
import ReactDOM from "react-dom";

type CardIconProps = {
  color: string;
  icon: ((props: React.ComponentProps<'svg'>) => JSX.Element) | undefined;
  filled: boolean;
  text: string | undefined;
  className: string | undefined; // custom styling
  clickable: boolean; // cursor and bg on hover
  onClick: (() => void) | undefined;
  styles: CSSProperties | undefined;
}

class CardIcon extends React.Component<CardIconProps> {
  public divRef: React.RefObject<HTMLDivElement>;
  public static CARD_WIDTH_PX: number;

  constructor(props: CardIconProps) {
    super(props);
    this.divRef = React.createRef<HTMLDivElement>();
  }

  render() {
    let classes = ["inline-block", "rounded-md", "w-24", "h-24", "border-4"];
    let style: CSSProperties = this.props.styles || {};

    let colorIsClass = this.props.color.includes("-");

    if (colorIsClass) {
      classes.push(`border-${this.props.color}`);
    } else {
      style.borderColor = this.props.color;
    }

    if (this.props.filled) {
      if (colorIsClass) {
        classes.push(`bg-${this.props.color}`);
      } else {
        style.backgroundColor = this.props.color;
      }
      classes.push('text-white');
    } else {
      if (colorIsClass) {
        classes.push(`text-${this.props.color}`);
      } else {
        style.color = this.props.color;
      }
    }

    if (this.props.clickable) {
      classes.push("hover:bg-gray-200");
      classes.push("cursor-pointer");
    } else {
      classes.push("cursor-not-allowed");
    }

    if (this.props.className) {
      classes.push(...this.props.className.split(' '));
    }

    let iconClasses = ['inline-block', 'h-10', 'w-10'];

    return (
        <div onClick={this.props.onClick} className={classes.join(' ')} style={style} ref={this.divRef}>
          {this.props.text && <p>{this.props.text}</p>}
          {this.props.icon && this.props.icon({className: iconClasses.join(' ')})}
        </div>
    )
  }
}


const pxPerRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
const cardIconWidthRem = 6;
const cardBorderAndMarginPx = 8;
CardIcon.CARD_WIDTH_PX = cardIconWidthRem * pxPerRem + cardBorderAndMarginPx;


class IconShelf extends React.Component {
  public divRef: React.RefObject<HTMLDivElement>;
  constructor(props: any) {
    super(props);
    this.divRef = React.createRef<HTMLDivElement>();
  }
  render() {
    return (
        <div className="flex flex-wrap gap-2 text-center text-4xl" ref={this.divRef}>
          {this.props.children}
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
    return <CardIcon color={player.color} icon={madeBet ? CheckIcon : DotsHorizontalIcon}
                     filled={madeBet} className={undefined}
                     clickable={false} onClick={undefined} text={undefined} styles={undefined}/>;
  }
}

type PrizeIconProps = {
  value: number;
}

class PrizeIcon extends React.Component<PrizeIconProps> {
  render() {
    let positive = this.props.value > 0;
    return <CardIcon color={positive ? "amber-400" : "indigo-600"}
                     icon={positive ? EmojiHappyIcon : EmojiSadIcon}
                     filled={false} className={undefined}
                     clickable={false} onClick={undefined}
                     text={this.props.value.toString()} styles={undefined}/>;
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
    let selected = (value == roundBets.get(player.id));
    if (player.remaining_cards.includes(value)) {
      // available bet
      return <CardIcon color={this.props.player.color} icon={selected ? CheckIcon : undefined} filled={selected}
                       text={value.toString()} clickable={true}
                       onClick={() => {
                         this.props.client.make_bet(value)
                       }}
                       className={undefined} styles={undefined}/>;
    } else {
      // previously made bet
      return <CardIcon color={"gray-400"} icon={CheckIcon} filled={false} text={value.toString()}
                       clickable={false} onClick={undefined} className={undefined} styles={undefined}/>
    }
  }
}

type BetAreaProps = {
  game: Game;
  player: Player;
  client: GameClient;
}

class BetSelectionShelf extends React.Component<BetAreaProps> {
  static BETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  public shelfRef: React.RefObject<IconShelf>;
  constructor(props: BetAreaProps) {
    super(props);
    this.shelfRef = React.createRef();
  }

  render() {
    return (
        <IconShelf ref={this.shelfRef}>
          {BetSelectionShelf.BETS.map((n) =>
              <BetIcon value={n} client={this.props.client} game={this.props.game} player={this.props.player}/>
          )}
        </IconShelf>
    )
  }
}

type RemainingTimeProps = {
  total: number;
}
type RemainingTimeState = {
  time: number;
}

class RemainingTime extends React.Component<RemainingTimeProps, RemainingTimeState> {
  private intervalHandle: number;

  resetTime() {
    this.setState({
      time: this.props.total,
    });
  }

  constructor(props: RemainingTimeProps) {
    super(props);
    this.state = {
      time: this.props.total,
    }
    this.intervalHandle = setInterval(() => {
      let new_time = 0;
      if (this.state.time > 0) {
        new_time = this.state.time - 1;
      }
      this.setState({time: new_time});
    }, 1000) as unknown as number;
  }

  render() {
    return <div className="w-80 h-2 rounded-md bg-gray-200">
      <div className="bg-blue-500 h-full rounded-md duration-200 ease-out"
           style={{width: `${this.state.time * 100 / this.props.total}%`}}/>
    </div>
  }
}

type BetAnimationAreaProps = {
  discardPileRef: React.RefObject<CardIcon>;
  parentDivRef: React.RefObject<HTMLDivElement>;
  betSelectionShelfRef: React.RefObject<BetSelectionShelf>;
  playerReadyShelfRef: React.RefObject<IconShelf>;
  visible: boolean;
  round: Round;
  game: Game;
  thisPlayerId: PlayerId;
}

type Point = {x: number, y: number};

class BetAnimationArea extends React.Component<BetAnimationAreaProps> {
  getStartPosition(player: Player, value: Card): Point {
    const w = CardIcon.CARD_WIDTH_PX;
    if(player.id == this.props.thisPlayerId) {
      // from betting area
      let bettingArea = this.props.betSelectionShelfRef.current!.shelfRef.current!.divRef.current;
      let r = bettingArea?.getBoundingClientRect()!;
      return {
        x: r.x + (value - 1) * w,
        y: r.y,
      };
    } else {
      // from player ready area
      let readyArea = this.props.playerReadyShelfRef.current?.divRef.current;
      let r = readyArea?.getBoundingClientRect()!;
      return {
        x: r.x + r.width / 2,
        y: r.y,
      }
    }
  }
  getEndPosition() {
    let r = this.props.discardPileRef.current!.divRef!.current!.getBoundingClientRect()!;
    return {
      x: r.x,
      y: r.y,
    }
  }
  getShelfPosition(index: number) {
    const w = CardIcon.CARD_WIDTH_PX;
    let r = this.props.parentDivRef.current?.getBoundingClientRect()!;
    return {
      x: r.x + w * index,
      y: r.y,
    }
  }
  render() {
    return (
        <IconShelf>
          {Array.from(this.props.round.bets.entries()).map(([key, value], i) => {
                const player = this.props.game.players.get(key) as Player;
                const winner = this.props.round.winner;

                let start = this.getStartPosition(player, value);
                let shelf = this.getShelfPosition(i);
                let end = this.getEndPosition();

                let icon = <CardIcon
                    color={player.color} icon={player.id == winner ? StarIcon : undefined}
                    filled={player.id == winner} text={value.toString()} clickable={false}
                    onClick={undefined} className={undefined} styles={
                  { transition: "500ms ease-in-out"}
                }/>;

                return <Transition in={this.props.visible} key={player.id} timeout={500}
                                   onEnter={(node: HTMLElement) => {
                                     node.style.transform = `translate(${start.x - shelf.x}px, ${start.y - shelf.y}px)`;
                                     node.style.transition = "";
                                     node.style.opacity = "0";
                                     // silly trick to skip animating to starting position
                                     setTimeout(() => {
                                       node.style.transition = "500ms ease-in-out";
                                       node.style.transform = `translate(0, 0)`;
                                       node.style.opacity = "1";
                                     }, 0);
                                   }}
                                   onExit={(node: HTMLElement) => {
                                     node.style.transitionDuration = "500ms";
                                     node.style.transform = `translate(${end.x - shelf.x}px, ${end.y - shelf.y}px)`;
                                     node.style.opacity = "0";
                                   }}>
                  { icon }
                </Transition>
              }
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
  private timer: React.RefObject<RemainingTime>;
  private discardPileRef: RefObject<CardIcon>;
  private bettingAnimationAreaParentDivRef: RefObject<HTMLDivElement>;
  private betSelectionShelfRef: RefObject<BetSelectionShelf>;
  private playerReadyShelfRef: RefObject<IconShelf>;

  constructor(props: PlayingAreaProps) {
    super(props);
    this.props.client.on_next_round((round) => {
      this.animate_round_advancement();
      this.setState({remaining_time: 14});
    });
    this.state = {
      display_bets: false,
      remaining_time: 14,
    };
    this.animateHandle = null;
    this.timer = React.createRef<RemainingTime>();
    this.discardPileRef = React.createRef<CardIcon>();
    this.bettingAnimationAreaParentDivRef = React.createRef<HTMLDivElement>();
    this.betSelectionShelfRef = React.createRef<BetSelectionShelf>();
    this.playerReadyShelfRef = React.createRef<IconShelf>();
  }

  animate_round_advancement() {
    if (this.animateHandle !== null) {
      this.setState({display_bets: false});
      clearTimeout(this.animateHandle);
    }
    this.setState({display_bets: true});
    this.animateHandle = setTimeout(() => {
      this.setState({display_bets: false});
    }, 3000) as unknown as number;
    this.timer?.current?.resetTime();
  }

  render() {
    return (
        <div className="flex flex-col items-center justify-between text-center min-h-[70vh]">
          <IconShelf ref={this.playerReadyShelfRef}>
            {this.props.client.get_other_players().map((player) =>
                <PlayerIcon player={player} game={this.props.game}/>
            )}
          </IconShelf>

          <div>
            <RemainingTime total={14} ref={this.timer}/>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex flex-col">
              <span>Prize Pool (TODO points):</span>
              <IconShelf>
                {this.props.game.current_round?.prize_pool.map((card) => {
                  return <PrizeIcon value={card}/>;
                })}
              </IconShelf>
              <span>Highest unique bet takes.</span>
            </div>
            <div ref={this.bettingAnimationAreaParentDivRef}>
              {
                  this.props.game.previous_rounds.length > 0 &&
                  <BetAnimationArea visible={this.state.display_bets}
                                    round={this.props.game.previous_rounds.at(-1) as Round}
                                    game={this.props.game}
                                    thisPlayerId={this.props.client.get_this_player()!.id}
                                    discardPileRef={this.discardPileRef}
                                    parentDivRef={this.bettingAnimationAreaParentDivRef}
                                    betSelectionShelfRef={this.betSelectionShelfRef}
                                    playerReadyShelfRef={this.playerReadyShelfRef} />
              }
            </div>
            <div>
              <CardIcon color={"gray-400"} icon={SaveIcon} filled={false} text={"Discard"}
                        clickable={true} onClick={() => alert("TODO")} className={"text-lg"}
                        styles={undefined} ref={this.discardPileRef}/>
              <span>
                Click for History
              </span>
            </div>
          </div>

          <div>
            <div>
              <span>Your bet:</span>
              <span>Your score: {this.props.client.get_this_player()?.total_score}</span>
            </div>
            {this.props.client.get_this_player() &&
                <BetSelectionShelf game={this.props.game} player={this.props.client.get_this_player() as Player}
                                   client={this.props.client} ref={this.betSelectionShelfRef}/>}
          </div>
        </div>
    );
  }
}
