import type { Category, MenuItem, Order, Payment, RestaurantSettings, RestaurantTable, StaffUser } from '../types'

export const STORAGE_KEY = 'joan-kitchen-state-v3'

/** Only the shared, restaurant-wide slice is persisted — never per-tab UI state. */
export interface PersistedState {
  version: 3
  categories: Category[]
  menuItems: MenuItem[]
  tables: RestaurantTable[]
  staff: StaffUser[]
  settings: RestaurantSettings
  orders: Order[]
  payments: Payment[]
}

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== 3) return null
    return parsed
  } catch {
    return null
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function savePersisted(state: PersistedState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Quota exceeded in a long demo session — the in-memory state still works.
    }
  }, 250)
}

export function clearPersisted() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
