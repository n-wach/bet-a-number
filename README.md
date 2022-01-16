# Bet A Number

A basic game consists of 15 rounds, and at least 2 players. Each player is given 15 numbers (from 1 to 15)
they can use to bid in a round. Each number can only be used once. In each round, players
are bidding for some number of prize points. The deck of prize cards contains the values from 1 to 10, 
and -1 to -5, and a random card is picked and revealed at the start of each round.

Once all players have placed a bid, they are revealed. If the prize is positive, the player
with the highest *unique* bid takes the points. If negative, the player with the lowest *unique*
bid takes. If there are no unique bids, the bids are discarded as usual, and an additional prize 
card is revealed. In the next round, players are betting for the combined value of both cards.

After all 15 rounds, the player with the most prize points wins.

## TODO

1. Animate prize pool with last round bets
2. Better player score UI
3. Clean up/improve UI (specifically mobile)
4. Round history (both under history button, and on game end screen)
5. Game settings (move timer enable/duration, deck)
6. Player customization (color, name)


