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
import {Transition} from 'react-transition-group'

function getUntransformedBoundingClientRect(node: HTMLElement): DOMRect {
  let parentRect = node.offsetParent?.getBoundingClientRect()!;
  let dx = node.offsetLeft!;
  let dy = node.offsetTop!;

  let thisRect = node.getBoundingClientRect()!;
  thisRect.x = parentRect.x + dx;
  thisRect.y = parentRect.y + dy;
  // other properties (top, bottom, left, right) update automatically.

  return thisRect;
}

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
  private readonly divRef: React.RefObject<HTMLDivElement>;

  constructor(props: CardIconProps) {
    super(props);
    this.divRef = React.createRef<HTMLDivElement>();
  }

  getBoundingClientRect(): DOMRect {
    return this.divRef.current!.getBoundingClientRect();
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


class IconShelf extends React.Component {
  render() {
    return (
        <div className="flex flex-wrap gap-2 text-center text-4xl">
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
  private readonly cardIconRef: React.RefObject<CardIcon>;
  constructor(props: PlayerIconProps) {
    super(props);
    this.cardIconRef = React.createRef();
  }
  getCardIcon() {
    return this.cardIconRef.current;
  }
  render() {
    const player = this.props.player;
    const madeBet = !!this.props.game.current_round?.bets.has(player.id);
    return <CardIcon color={player.color} icon={madeBet ? CheckIcon : DotsHorizontalIcon}
                     filled={madeBet} className={undefined}
                     clickable={false} onClick={undefined} text={undefined} styles={undefined}
                     ref={this.cardIconRef}/>;
  }
}

type PlayerReadyShelfProps = {
  game: Game,
  client: GameClient,
}

class PlayerReadyShelf extends React.Component<PlayerReadyShelfProps> {
  private cardRefs: Map<PlayerId, React.RefObject<PlayerIcon>>;
  constructor(props: PlayerReadyShelfProps) {
    super(props);
    this.cardRefs = new Map();
    for(let player of this.props.client.get_other_players()) {
      this.cardRefs.set(player.id, React.createRef());
    }
  }
  getIconForPlayer(player: Player): PlayerIcon | null {
    return this.cardRefs.get(player.id)?.current || null;
  }
  render() {
    return <IconShelf>
      {this.props.client.get_other_players().map((player) =>
          <PlayerIcon player={player} game={this.props.game} ref={this.cardRefs.get(player.id)}/>
      )}
    </IconShelf>
  }
}

type PrizeIconProps = {
  value: number;
}

class PrizeIcon extends React.Component<PrizeIconProps> {
  private readonly cardIconRef: React.RefObject<CardIcon>;
  constructor(props: PrizeIconProps) {
    super(props);
    this.cardIconRef = React.createRef();
  }
  getCardIcon() {
    return this.cardIconRef.current;
  }
  render() {
    let positive = this.props.value > 0;
    return <CardIcon color={positive ? "amber-400" : "indigo-600"}
                     icon={positive ? EmojiHappyIcon : EmojiSadIcon}
                     filled={false} className={undefined}
                     clickable={false} onClick={undefined}
                     text={this.props.value.toString()} styles={undefined}
                     ref={this.cardIconRef}/>;
  }
}

type BetIconProps = {
  value: number;
  client: GameClient;
  game: Game;
  player: Player;
}

class BetIcon extends React.Component<BetIconProps> {
  private readonly cardIconRef: React.RefObject<CardIcon>;
  constructor(props: BetIconProps) {
    super(props);
    this.cardIconRef = React.createRef();
  }
  getCardIcon() {
    return this.cardIconRef.current;
  }
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
                       className={undefined} styles={undefined}
                       ref={this.cardIconRef}/>;
    } else {
      // previously made bet
      return <CardIcon color={"gray-400"} icon={CheckIcon} filled={false} text={value.toString()}
                       clickable={false} onClick={undefined} className={undefined} styles={undefined}
                       ref={this.cardIconRef}/>;
    }
  }
}

type BetSelectionShelfProps = {
  game: Game;
  player: Player;
  client: GameClient;
}

class BetSelectionShelf extends React.Component<BetSelectionShelfProps> {
  static BETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  private cardRefs: Map<Card, React.RefObject<BetIcon>>;
  constructor(props: BetSelectionShelfProps) {
    super(props);
    this.cardRefs = new Map();
    for(let i of BetSelectionShelf.BETS) {
      this.cardRefs.set(i, React.createRef());
    }
  }
  getSpecificBetIcon(value: Card): BetIcon | null {
    return this.cardRefs.get(value)?.current || null;
  }
  render() {
    return (
        <IconShelf>
          {BetSelectionShelf.BETS.map((n) =>
              <BetIcon value={n} client={this.props.client} game={this.props.game} player={this.props.player} ref={this.cardRefs.get(n)!}/>
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
  betSelectionShelfRef: React.RefObject<BetSelectionShelf>;
  playerReadyShelfRef: React.RefObject<PlayerReadyShelf>;
  visible: boolean;
  round: Round | null;
  game: Game;
  thisPlayerId: PlayerId;
}

class BetAnimationArea extends React.Component<BetAnimationAreaProps> {
  static ANIMATION_DURATION_MS = 500;
  getStartPosition(player: Player, value: Card): DOMRect | null {
    let icon: CardIcon | null | undefined;
    if(player.id == this.props.thisPlayerId) {
      // from betting area
      icon = this.props.betSelectionShelfRef.current?.getSpecificBetIcon(value)?.getCardIcon();
    } else {
      // from player ready area
      icon = this.props.playerReadyShelfRef.current?.getIconForPlayer(player)?.getCardIcon();
    }
    return icon?.getBoundingClientRect() || null;
  }
  getEndPosition(): DOMRect | null {
    let icon = this.props.discardPileRef.current;
    return icon?.getBoundingClientRect() || null;
  }
  render() {
    return (
        <IconShelf>
          {this.props.round &&
              Array.from(this.props.round.bets.entries()).map(([key, value], i) => {
                const player = this.props.game.players.get(key)!;
                const winner = this.props.round!.winner;

                let ref = React.createRef<CardIcon>();

                let icon = <CardIcon key={player.id}
                    color={player.color} icon={player.id == winner ? StarIcon : undefined}
                    filled={player.id == winner} text={value.toString()} clickable={false}
                    onClick={undefined} className={undefined} ref={ref} styles={
                  { transition: `${BetAnimationArea.ANIMATION_DURATION_MS}ms ease-in-out`}
                }/>;

                return <Transition in={this.props.visible} key={player.id} appear={true}
                                   timeout={BetAnimationArea.ANIMATION_DURATION_MS}
                                   onEnter={(node: HTMLElement) => {
                                    node.style.opacity = "0";
                                    node.style.transition = "";
                                   }
                                   }
                                   onEntering={(node: HTMLElement) => {
                                     // wait for component to be mounted
                                     setTimeout(() => {
                                       let start = this.getStartPosition(player, value);
                                       let pos = getUntransformedBoundingClientRect(node);

                                       let startDx = 0;
                                       let startDy = 0;
                                       if(start && pos) {
                                         startDx = start.x - pos.x;
                                         startDy = start.y - pos.y;
                                       }

                                       node.style.transform = `translate(${startDx}px, ${startDy}px)`;
                                       // silly trick to skip animating to starting position
                                       setTimeout(() => {
                                         node.style.transition = `${BetAnimationArea.ANIMATION_DURATION_MS}ms ease-in-out`;
                                         node.style.transform = `translate(0, 0)`;
                                         node.style.opacity = "1";
                                       }, 50);
                                     }, 0);
                                   }}
                                   onExit={(node: HTMLElement) => {
                                     let end = this.getEndPosition();
                                     let pos = getUntransformedBoundingClientRect(node);

                                     let endDx = 0;
                                     let endDy = 0;
                                     if(end && pos) {
                                       endDx = end.x - pos.x;
                                       endDy = end.y - pos.y;
                                     }

                                     node.style.transitionDuration = `${BetAnimationArea.ANIMATION_DURATION_MS}ms`;
                                     node.style.transform = `translate(${endDx}px, ${endDy}px)`;
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
  private readonly timer: React.RefObject<RemainingTime>;
  private readonly discardPileRef: RefObject<CardIcon>;
  private readonly betSelectionShelfRef: RefObject<BetSelectionShelf>;
  private readonly playerReadyShelfRef: RefObject<PlayerReadyShelf>;

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
    this.timer = React.createRef();
    this.discardPileRef = React.createRef();
    this.betSelectionShelfRef = React.createRef();
    this.playerReadyShelfRef = React.createRef();
  }

  animate_round_advancement() {
    if (this.animateHandle !== null) {
      this.setState({display_bets: false});
      clearTimeout(this.animateHandle);
    }
    this.setState({display_bets: true});
    this.animateHandle = setTimeout(() => {
      this.setState({display_bets: false});
    }, 5000) as unknown as number;
    this.timer?.current?.resetTime();
  }

  render() {
    return (
        <div className="flex flex-col items-center justify-between text-center min-h-[70vh]">
          <PlayerReadyShelf game={this.props.game} client={this.props.client} ref={this.playerReadyShelfRef}/>

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
            <div>
              <BetAnimationArea visible={this.state.display_bets}
                                round={this.props.game.previous_rounds.at(-1) || null}
                                game={this.props.game}
                                thisPlayerId={this.props.client.get_this_player()!.id}
                                discardPileRef={this.discardPileRef}
                                betSelectionShelfRef={this.betSelectionShelfRef}
                                playerReadyShelfRef={this.playerReadyShelfRef} />
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
