import type { PersistedState } from './persist'
import { CATEGORIES, MENU_ITEMS } from '../data/menu'
import { SETTINGS, STAFF, TABLES } from '../data/restaurant'
import { generateHistory } from '../data/history'
import { buildLiveOrders } from '../data/liveOrders'

/** A complete, believable restaurant at the moment a reviewer opens the prototype. */
export function seedState(): PersistedState {
  const history = generateHistory()
  const live = buildLiveOrders()
  return {
    version: 3,
    categories: CATEGORIES.map((c) => ({ ...c })),
    menuItems: MENU_ITEMS.map((i) => ({ ...i })),
    tables: TABLES.map((t) => ({ ...t })),
    staff: STAFF.map((s) => ({ ...s })),
    settings: { ...SETTINGS },
    orders: [...live.orders, ...history.orders],
    payments: [...live.payments, ...history.payments],
  }
}
