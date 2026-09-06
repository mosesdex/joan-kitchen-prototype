import { create } from 'zustand'
import type {
  Category,
  ID,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  RestaurantSettings,
  RestaurantTable,
  StaffUser,
  TableStatus,
} from '../types'
import { makeBankReference, makeId, makeOrderReference } from '../lib/id'
import { calculateTotals, estimateEta } from '../lib/pricing'
import type { AppEvent } from './events'
import { clearPersisted, loadPersisted, savePersisted, type PersistedState } from './persist'
import { reduce } from './reducer'
import { seedState } from './seedState'
import { createSyncAdapter, type SyncAdapter } from './sync'

interface LocalState {
  /** Table this iPad is bound to. Per-device, never broadcast. */
  activeTableId: ID | null
  cart: OrderItem[]
  cartNote: string
  /** Orders placed from this device in this sitting. */
  sessionOrderIds: ID[]
  /** Signed-in admin user. Per-device. */
  currentUserId: ID | null
  /** When no kitchen tab is open, advance orders on a timer. */
  autoKitchen: boolean
  soundEnabled: boolean
  hydrated: boolean
}

interface Actions {
  /** Apply an event locally and broadcast it to the other surfaces. */
  dispatch: (event: AppEvent) => void
  /** Apply an event received from another surface. Never re-broadcasts. */
  applyRemote: (event: AppEvent) => void

  // customer
  setActiveTable: (tableId: ID | null) => void
  addToCart: (item: OrderItem) => void
  updateCartItem: (lineId: ID, patch: Partial<OrderItem>) => void
  removeCartItem: (lineId: ID) => void
  clearCart: () => void
  setCartNote: (note: string) => void
  placeOrder: (method: PaymentMethod) => Order
  callWaiter: (orderId: ID) => void

  // kitchen
  advanceOrder: (orderId: ID, status: OrderStatus, by: string) => void
  cancelOrder: (orderId: ID, reason: string, by: string) => void

  // payments
  setPaymentStatus: (paymentId: ID, status: PaymentStatus, by?: string) => void

  // admin
  signIn: (userId: ID) => void
  signOut: () => void
  upsertMenuItem: (item: MenuItem) => void
  deleteMenuItem: (itemId: ID) => void
  reorderMenuItems: (categoryId: ID, orderedIds: ID[]) => void
  upsertCategory: (category: Category) => void
  deleteCategory: (categoryId: ID) => void
  reorderCategories: (orderedIds: ID[]) => void
  upsertTable: (table: RestaurantTable) => void
  deleteTable: (tableId: ID) => void
  setTableStatus: (tableId: ID, status: TableStatus) => void
  upsertStaff: (user: StaffUser) => void
  deleteStaff: (userId: ID) => void
  updateSettings: (settings: RestaurantSettings) => void

  // demo controls
  setAutoKitchen: (on: boolean) => void
  setSoundEnabled: (on: boolean) => void
  resetDemo: () => void
}

export type StoreState = PersistedState & LocalState & Actions

let adapter: SyncAdapter | null = null

function initialShared(): PersistedState {
  if (typeof window === 'undefined') return seedState()
  return loadPersisted() ?? seedState()
}

export const useStore = create<StoreState>((set, get) => {
  const commit = (event: AppEvent, broadcast: boolean) => {
    set((state) => {
      const shared: PersistedState = {
        version: 3,
        categories: state.categories,
        menuItems: state.menuItems,
        tables: state.tables,
        staff: state.staff,
        settings: state.settings,
        orders: state.orders,
        payments: state.payments,
      }
      const next = reduce(shared, event)
      savePersisted(next)
      return next
    })
    if (broadcast) adapter?.publish(event)
  }

  return {
    ...initialShared(),
    activeTableId: null,
    cart: [],
    cartNote: '',
    sessionOrderIds: [],
    currentUserId: null,
    autoKitchen: true,
    soundEnabled: true,
    hydrated: true,

    dispatch: (event) => commit(event, true),
    applyRemote: (event) => commit(event, false),

    /* ---------------- customer ---------------- */

    setActiveTable: (tableId) => set({ activeTableId: tableId, sessionOrderIds: [] }),

    addToCart: (item) =>
      set((state) => {
        // Identical dish with identical options merges into one line.
        const signature = (line: OrderItem) =>
          `${line.menuItemId}|${line.notes}|${line.selectedOptions
            .map((o) => o.optionId)
            .sort()
            .join(',')}`
        const match = state.cart.find((line) => signature(line) === signature(item))
        if (match) {
          return {
            cart: state.cart.map((line) =>
              line.id === match.id ? { ...line, quantity: line.quantity + item.quantity } : line,
            ),
          }
        }
        return { cart: [...state.cart, item] }
      }),

    updateCartItem: (lineId, patch) =>
      set((state) => ({
        cart: state.cart.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
      })),

    removeCartItem: (lineId) =>
      set((state) => ({ cart: state.cart.filter((line) => line.id !== lineId) })),

    clearCart: () => set({ cart: [], cartNote: '' }),

    setCartNote: (note) => set({ cartNote: note }),

    placeOrder: (method) => {
      const state = get()
      const table = state.tables.find((t) => t.id === state.activeTableId)
      const totals = calculateTotals(state.cart, state.settings)
      const etaMinutes = estimateEta(
        state.cart.map((line) => ({
          prepMinutes: state.menuItems.find((m) => m.id === line.menuItemId)?.prepMinutes ?? 12,
          quantity: line.quantity,
        })),
      )
      const now = Date.now()
      const orderId = makeId('ord')
      const paymentId = makeId('pay')

      const payment: Payment = {
        id: paymentId,
        orderId,
        method,
        status: method === 'bank-transfer' ? 'awaiting-confirmation' : 'unpaid',
        amount: totals.total,
        reference: makeBankReference(),
        createdAt: now,
      }

      const order: Order = {
        id: orderId,
        reference: makeOrderReference(),
        tableId: table?.id ?? '',
        tableLabel: table?.label ?? '—',
        items: state.cart.map((line) => ({ ...line })),
        status: 'new',
        totals,
        note: state.cartNote,
        paymentId,
        paymentMethod: method,
        paymentStatus: payment.status,
        placedAt: now,
        history: [{ status: 'new', at: now, by: 'Guest' }],
        etaMinutes,
      }

      commit({ type: 'order/placed', order, payment }, true)
      set((s) => ({ cart: [], cartNote: '', sessionOrderIds: [order.id, ...s.sessionOrderIds] }))
      return order
    },

    callWaiter: (orderId) =>
      commit({ type: 'order/waiter-called', orderId, at: Date.now() }, true),

    /* ---------------- kitchen ---------------- */

    advanceOrder: (orderId, status, by) =>
      commit({ type: 'order/status-changed', orderId, status, by, at: Date.now() }, true),

    cancelOrder: (orderId, reason, by) =>
      commit({ type: 'order/cancelled', orderId, reason, by, at: Date.now() }, true),

    /* ---------------- payments ---------------- */

    setPaymentStatus: (paymentId, status, by) =>
      commit({ type: 'payment/status-changed', paymentId, status, by, at: Date.now() }, true),

    /* ---------------- admin ---------------- */

    signIn: (userId) => set({ currentUserId: userId }),
    signOut: () => set({ currentUserId: null }),

    upsertMenuItem: (item) => commit({ type: 'menu/item-upserted', item }, true),
    deleteMenuItem: (itemId) => commit({ type: 'menu/item-deleted', itemId }, true),
    reorderMenuItems: (categoryId, orderedIds) =>
      commit({ type: 'menu/items-reordered', categoryId, orderedIds }, true),
    upsertCategory: (category) => commit({ type: 'menu/category-upserted', category }, true),
    deleteCategory: (categoryId) => commit({ type: 'menu/category-deleted', categoryId }, true),
    reorderCategories: (orderedIds) => commit({ type: 'menu/categories-reordered', orderedIds }, true),
    upsertTable: (table) => commit({ type: 'table/upserted', table }, true),
    deleteTable: (tableId) => commit({ type: 'table/deleted', tableId }, true),
    setTableStatus: (tableId, status) => commit({ type: 'table/status-changed', tableId, status }, true),
    upsertStaff: (user) => commit({ type: 'staff/upserted', user }, true),
    deleteStaff: (userId) => commit({ type: 'staff/deleted', userId }, true),
    updateSettings: (settings) => commit({ type: 'settings/updated', settings }, true),

    /* ---------------- demo controls ---------------- */

    setAutoKitchen: (on) => set({ autoKitchen: on }),
    setSoundEnabled: (on) => set({ soundEnabled: on }),

    resetDemo: () => {
      clearPersisted()
      commit({ type: 'demo/reset' }, true)
      set({ cart: [], cartNote: '', sessionOrderIds: [], activeTableId: null, currentUserId: null })
    },
  }
})

/** Wire the sync transport. Called once from the app root. */
export function connectSync(): () => void {
  adapter = createSyncAdapter()
  const unsubscribe = adapter.subscribe((event) => {
    useStore.getState().applyRemote(event)
  })
  return () => {
    unsubscribe()
    adapter?.close()
    adapter = null
  }
}

export function syncAdapterName(): string {
  return adapter?.name ?? 'disconnected'
}
