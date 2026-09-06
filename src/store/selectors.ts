import type { Category, MenuItem, Order, Payment } from '../types'
import { ACTIVE_ORDER_STATUSES } from '../types'
import { DAY, startOfDay } from '../lib/time'
import type { PersistedState } from './persist'

export function activeCategories(state: Pick<PersistedState, 'categories'>): Category[] {
  return [...state.categories].filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder)
}

export function itemsInCategory(
  state: Pick<PersistedState, 'menuItems'>,
  categoryId: string,
): MenuItem[] {
  return state.menuItems
    .filter((i) => i.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function featuredItems(state: Pick<PersistedState, 'menuItems'>): MenuItem[] {
  return state.menuItems.filter((i) => i.featured && i.available)
}

export function activeOrders(state: Pick<PersistedState, 'orders'>): Order[] {
  return state.orders
    .filter((o) => ACTIVE_ORDER_STATUSES.includes(o.status))
    .sort((a, b) => a.placedAt - b.placedAt)
}

export function ordersToday(state: Pick<PersistedState, 'orders'>): Order[] {
  const from = startOfDay(Date.now())
  return state.orders.filter((o) => o.placedAt >= from)
}

export function ordersBetween(
  state: Pick<PersistedState, 'orders'>,
  from: number,
  to: number,
): Order[] {
  return state.orders.filter((o) => o.placedAt >= from && o.placedAt < to)
}

export interface SalesSummary {
  revenue: number
  orderCount: number
  averageTicket: number
  coversSeated: number
  cancelledCount: number
}

/** Cancelled orders are excluded from revenue but counted separately. */
export function summarise(orders: Order[]): SalesSummary {
  const settled = orders.filter((o) => o.status !== 'cancelled')
  const revenue = settled.reduce((sum, o) => sum + o.totals.total, 0)
  return {
    revenue,
    orderCount: settled.length,
    averageTicket: settled.length ? Math.round(revenue / settled.length) : 0,
    coversSeated: new Set(settled.map((o) => o.tableId)).size,
    cancelledCount: orders.length - settled.length,
  }
}

export interface DailyPoint {
  date: string
  timestamp: number
  revenue: number
  orders: number
}

export function dailySeries(orders: Order[], days: number): DailyPoint[] {
  const today = startOfDay(Date.now())
  const points: DailyPoint[] = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const from = today - i * DAY
    const to = from + DAY
    const window = orders.filter(
      (o) => o.placedAt >= from && o.placedAt < to && o.status !== 'cancelled',
    )
    points.push({
      date: new Date(from).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
      timestamp: from,
      revenue: window.reduce((sum, o) => sum + o.totals.total, 0),
      orders: window.length,
    })
  }
  return points
}

export interface ItemPerformance {
  itemId: string
  name: string
  quantity: number
  revenue: number
}

export function itemPerformance(orders: Order[]): ItemPerformance[] {
  const map = new Map<string, ItemPerformance>()
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    for (const line of order.items) {
      const unit = line.selectedOptions.reduce((sum, o) => sum + o.priceDelta, line.unitPrice)
      const entry = map.get(line.menuItemId) ?? {
        itemId: line.menuItemId,
        name: line.name,
        quantity: 0,
        revenue: 0,
      }
      entry.quantity += line.quantity
      entry.revenue += unit * line.quantity
      map.set(line.menuItemId, entry)
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export function categoryPerformance(
  orders: Order[],
  menuItems: MenuItem[],
  categories: Category[],
): { name: string; revenue: number; quantity: number }[] {
  const byItem = itemPerformance(orders)
  const map = new Map<string, { name: string; revenue: number; quantity: number }>()
  for (const perf of byItem) {
    const item = menuItems.find((m) => m.id === perf.itemId)
    const category = categories.find((c) => c.id === item?.categoryId)
    const key = category?.id ?? 'unknown'
    const entry = map.get(key) ?? {
      name: category?.name ?? 'Removed items',
      revenue: 0,
      quantity: 0,
    }
    entry.revenue += perf.revenue
    entry.quantity += perf.quantity
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

/** Orders per hour, averaged across the supplied window. */
export function hourlyHeat(orders: Order[]): { hour: number; orders: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }))
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    buckets[new Date(order.placedAt).getHours()].orders += 1
  }
  return buckets
}

export function paymentMix(
  orders: Order[],
  payments: Payment[],
): { method: string; label: string; amount: number; count: number }[] {
  const labels: Record<string, string> = {
    'bank-transfer': 'Bank transfer',
    'pay-at-table': 'Pay at table',
  }
  const map = new Map<string, { method: string; label: string; amount: number; count: number }>()
  for (const order of orders) {
    if (order.status === 'cancelled') continue
    const payment = payments.find((p) => p.id === order.paymentId)
    const method = payment?.method ?? order.paymentMethod ?? 'pay-at-table'
    const entry = map.get(method) ?? {
      method,
      label: labels[method] ?? method,
      amount: 0,
      count: 0,
    }
    entry.amount += order.totals.total
    entry.count += 1
    map.set(method, entry)
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount)
}

/** Median minutes from `new` to `ready`, the number a kitchen actually cares about. */
export function medianTicketMinutes(orders: Order[]): number {
  const durations: number[] = []
  for (const order of orders) {
    const placed = order.history.find((h) => h.status === 'new')?.at
    const ready = order.history.find((h) => h.status === 'ready')?.at
    if (placed && ready) durations.push((ready - placed) / 60000)
  }
  if (durations.length === 0) return 0
  durations.sort((a, b) => a - b)
  const mid = Math.floor(durations.length / 2)
  const median =
    durations.length % 2 === 0 ? (durations[mid - 1] + durations[mid]) / 2 : durations[mid]
  return Math.round(median)
}
