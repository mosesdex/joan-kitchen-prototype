import type { Order, OrderItem, Payment, SelectedOption } from '../types'
import { calculateTotals, estimateEta } from '../lib/pricing'
import { DAY, HOUR, MINUTE, startOfDay } from '../lib/time'
import { MENU_ITEMS } from './menu'
import { SETTINGS, STAFF, TABLES } from './restaurant'

/**
 * Historical orders back the admin reports. They are generated from a fixed
 * seed so every reviewer sees the same charts, and regenerated relative to
 * "today" so the dashboard is never showing a stale date range.
 */

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HISTORY_DAYS = 14

/** Orders per hour of day, indexed 0–23. Lunch and dinner peaks. */
const HOUR_WEIGHTS = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 7, 9, 6, 3, 3, 5, 9, 11, 8, 5, 2, 0,
]

const availableItems = MENU_ITEMS.filter((i) => i.available)
const kitchenStaff = STAFF.filter((s) => s.role === 'kitchen' || s.role === 'manager')
const waiters = STAFF.filter((s) => s.role === 'waiter' && s.active)

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

function buildItem(rand: () => number, ref: number): OrderItem {
  const menuItem = pick(rand, availableItems)
  const selectedOptions: SelectedOption[] = []
  for (const group of menuItem.optionGroups) {
    const choices = group.options.filter((o) => o.available)
    if (choices.length === 0) continue
    if (group.type === 'single') {
      if (group.required || rand() < 0.5) {
        const choice = pick(rand, choices)
        selectedOptions.push({
          groupId: group.id,
          groupName: group.name,
          optionId: choice.id,
          optionName: choice.name,
          priceDelta: choice.priceDelta,
        })
      }
    } else {
      const max = Math.min(group.maxSelections ?? choices.length, choices.length)
      const take = Math.floor(rand() * (max + 1))
      const shuffled = [...choices].sort(() => rand() - 0.5).slice(0, take)
      for (const choice of shuffled) {
        selectedOptions.push({
          groupId: group.id,
          groupName: group.name,
          optionId: choice.id,
          optionName: choice.name,
          priceDelta: choice.priceDelta,
        })
      }
    }
  }
  return {
    id: `oi_h${ref}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    unitPrice: menuItem.price,
    quantity: rand() < 0.78 ? 1 : rand() < 0.85 ? 2 : 3,
    selectedOptions,
    notes: '',
    imageUrl: menuItem.imageUrl,
    imageTone: menuItem.imageTone,
  }
}

export interface GeneratedHistory {
  orders: Order[]
  payments: Payment[]
}

export function generateHistory(seed = 20260906): GeneratedHistory {
  const rand = mulberry32(seed)
  const orders: Order[] = []
  const payments: Payment[] = []
  const today = startOfDay(Date.now())
  let counter = 0

  for (let dayOffset = HISTORY_DAYS; dayOffset >= 1; dayOffset -= 1) {
    const dayStart = today - dayOffset * DAY
    const weekday = new Date(dayStart).getDay()
    // Friday and Saturday run roughly 45% busier than a Tuesday.
    const dayMultiplier = weekday === 5 || weekday === 6 ? 1.45 : weekday === 0 ? 1.15 : 1

    for (let hour = 0; hour < 24; hour += 1) {
      const expected = HOUR_WEIGHTS[hour] * dayMultiplier * 0.75
      const count = Math.round(expected + (rand() - 0.5) * expected)
      for (let n = 0; n < count; n += 1) {
        counter += 1
        const placedAt = dayStart + hour * HOUR + Math.floor(rand() * HOUR)
        const itemCount = 1 + Math.floor(rand() * 4)
        const items = Array.from({ length: itemCount }, () => buildItem(rand, counter))
        const totals = calculateTotals(items, SETTINGS)
        const table = pick(rand, TABLES)
        const cancelled = rand() < 0.045
        const method = rand() < 0.62 ? 'bank-transfer' : 'pay-at-table'
        const etaMinutes = estimateEta(
          items.map((i) => ({
            prepMinutes: MENU_ITEMS.find((m) => m.id === i.menuItemId)?.prepMinutes ?? 12,
            quantity: i.quantity,
          })),
        )
        const orderId = `ord_h${counter}`
        const paymentId = `pay_h${counter}`
        const cook = pick(rand, kitchenStaff)
        const server = pick(rand, waiters)

        const history = cancelled
          ? [
              { status: 'new' as const, at: placedAt, by: 'Guest' },
              {
                status: 'cancelled' as const,
                at: placedAt + Math.floor(rand() * 6 * MINUTE),
                by: cook.name,
              },
            ]
          : [
              { status: 'new' as const, at: placedAt, by: 'Guest' },
              {
                status: 'accepted' as const,
                at: placedAt + Math.floor(rand() * 3 * MINUTE),
                by: cook.name,
              },
              {
                status: 'preparing' as const,
                at: placedAt + Math.floor((3 + rand() * 3) * MINUTE),
                by: cook.name,
              },
              {
                status: 'ready' as const,
                at: placedAt + Math.floor(etaMinutes * (0.8 + rand() * 0.5) * MINUTE),
                by: cook.name,
              },
              {
                status: 'served' as const,
                at: placedAt + Math.floor((etaMinutes + 2 + rand() * 4) * MINUTE),
                by: server.name,
              },
            ]

        payments.push({
          id: paymentId,
          orderId,
          method,
          status: cancelled ? 'unpaid' : method === 'bank-transfer' ? 'paid' : 'paid',
          amount: totals.total,
          reference: `JKP${(100000 + counter).toString(36).toUpperCase()}`,
          createdAt: placedAt,
          settledAt: cancelled ? undefined : placedAt + Math.floor(rand() * 20 * MINUTE),
          settledBy: cancelled ? undefined : method === 'pay-at-table' ? server.name : undefined,
        })

        orders.push({
          id: orderId,
          reference: `JK-${(4000 + counter).toString().slice(-4)}`,
          tableId: table.id,
          tableLabel: table.label,
          items,
          status: cancelled ? 'cancelled' : 'served',
          totals,
          note: '',
          paymentId,
          paymentMethod: method,
          paymentStatus: cancelled ? 'unpaid' : 'paid',
          placedAt,
          history,
          cancelReason: cancelled
            ? pick(rand, [
                'Guest changed their mind',
                'Item out of stock',
                'Duplicate order from the same table',
              ])
            : undefined,
          etaMinutes,
        })
      }
    }
  }

  orders.sort((a, b) => b.placedAt - a.placedAt)
  return { orders, payments }
}
