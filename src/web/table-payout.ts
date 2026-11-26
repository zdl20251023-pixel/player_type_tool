import Decimal from 'decimal.js'
import type { TableHand } from '../table/engine'
import { payoutPlan } from '../table/pots'

// Presentation only: all balances below come from the already committed settlement.
export class TablePayout {
  private timers: ReturnType<typeof setTimeout>[] = []
  private animations: Animation[] = []
  private flights: HTMLElement[] = []
  private restore: (() => void) | null = null
  cancel() {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.animations.forEach((a) => a.cancel())
    this.animations = []
    this.flights.forEach((el) => el.remove())
    this.flights = []
    this.restore?.()
    this.restore = null
  }
  play(surface: HTMLElement, hand: TableHand, elapsed = 0) {
    this.cancel()
    if (!hand.complete) {
      return
    }
    const table = surface.querySelector<HTMLElement>('.poker-table')
    if (!table) {
      return
    }
    const plan = payoutPlan(hand)
    const stacks = hand.players.map((p) =>
      surface.querySelector<HTMLElement>(`.seat-${p.seat} .table-stack`)
    )
    const amount = (n: number) => `${new Decimal(n).div(100).toFixed(2)} <small>BB</small>`
    const render = (time: number) => {
      const received = Array<number>(6).fill(0)
      for (const pot of plan.filter((p) => p.endMs <= time)) {
        for (const payout of pot.payouts) {
          received[payout.seat] = new Decimal(received[payout.seat]).plus(payout.amount).toNumber()
        }
      }
      for (const p of hand.players) {
        if (stacks[p.seat]) {
          stacks[p.seat]!.innerHTML = amount(
            new Decimal(p.stack).minus(hand.awards[p.seat]).plus(received[p.seat]).toNumber()
          )
        }
      }
    }
    this.restore = () => {
      hand.players.forEach((p) => {
        if (stacks[p.seat]) {
          stacks[p.seat]!.innerHTML = amount(p.stack)
        }
      })
      surface.querySelectorAll<HTMLElement>('.table-pot-card').forEach((card) => {
        card.classList.remove('paying')
        card.classList.add('paid')
        const status = card.querySelector('.table-pot-award-status')
        if (status) {
          status.textContent = '已派奖'
        }
      })
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.restore()
      return
    }
    const queue = (ms: number, fn: () => void) => {
      if (ms <= 0) {
        fn()
      } else {
        this.timers.push(setTimeout(fn, ms))
      }
    }
    render(elapsed)
    const rect = table.getBoundingClientRect()
    for (const pot of plan) {
      const card = surface.querySelector<HTMLElement>(`[data-table-pot="${pot.index}"]`)
      if (!card) {
        continue
      }
      const status = card.querySelector('.table-pot-award-status')
      if (pot.endMs <= elapsed) {
        card.classList.add('paid')
        if (status) {
          status.textContent = '已派奖'
        }
        continue
      }
      card.classList.remove('paid')
      if (status) {
        status.textContent = '待派奖'
      }
      queue(pot.startMs - elapsed, () => {
        card.classList.add('paying')
        if (status) {
          status.textContent = '派奖中…'
        }
      })
      for (const payout of pot.payouts) {
        const target = surface.querySelector<HTMLElement>(`.seat-${payout.seat} .table-nameplate`)
        if (!target || !payout.amount) {
          continue
        }
        const from = card.getBoundingClientRect(),
          to = target.getBoundingClientRect()
        const sx = from.left + from.width / 2 - rect.left - 40,
          sy = from.top + from.height / 2 - rect.top - 16
        const tx = to.left + to.width / 2 - rect.left - 40,
          ty = to.top + to.height / 2 - rect.top - 16
        const chip = document.createElement('span')
        chip.className = 'table-payout-flight'
        chip.setAttribute('aria-hidden', 'true')
        chip.innerHTML = `<i>●●●</i><b>+${new Decimal(payout.amount).div(100).toFixed(2)} BB</b>`
        table.append(chip)
        this.flights.push(chip)
        const animation = chip.animate(
          [
            { transform: `translate(${sx}px,${sy}px) scale(.75)`, opacity: 0 },
            { transform: `translate(${sx}px,${sy}px) scale(1)`, opacity: 1, offset: 0.1 },
            {
              transform: `translate(${(sx + tx) / 2}px,${(sy + ty) / 2 - 24}px) scale(1.08)`,
              opacity: 1,
              offset: 0.55,
            },
            { transform: `translate(${tx}px,${ty}px) scale(.85)`, opacity: 0 },
          ],
          {
            duration: 950,
            delay: Math.max(0, pot.startMs - elapsed),
            fill: 'both',
            easing: 'ease-in-out',
          }
        )
        this.animations.push(animation)
        if (elapsed > pot.startMs) {
          animation.currentTime = elapsed - pot.startMs
        }
        queue(pot.endMs - elapsed, () => {
          animation.cancel()
          chip.remove()
        })
      }
      queue(pot.endMs - elapsed, () => {
        card.classList.remove('paying')
        card.classList.add('paid')
        if (status) {
          status.textContent = '已派奖'
        }
        render(pot.endMs)
      })
    }
  }
}
