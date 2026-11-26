import type { TableHand } from '../table/engine'
import { sub } from '../table/engine'
import type { TableHandReview } from '../contracts/table'

export function reviewTableHand(
  hand: Pick<
    TableHand,
    'number' | 'button' | 'complete' | 'board' | 'players' | 'events' | 'awards'
  >
): TableHandReview {
  return {
    number: hand.number,
    button: hand.button,
    complete: hand.complete,
    board: [...hand.board],
    players: hand.players.map((p) => ({
      seat: p.seat,
      position: p.position,
      label: p.config.label,
      cards: [...p.cards],
      initial: p.initial,
      stack: p.stack,
      folded: p.folded,
      lastAction: p.lastAction,
    })),
    events: structuredClone(hand.events),
    profit: hand.players.map((p) => sub(p.stack, p.initial)),
    winners: hand.players.filter((p) => hand.awards[p.seat] > 0).map((p) => p.seat),
  }
}
