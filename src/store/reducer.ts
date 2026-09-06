import type { AppEvent } from './events'
import type { PersistedState } from './persist'
import { seedState } from './seedState'

/**
 * Pure reducer shared by every surface. Local actions and events arriving from
 * another tab go through exactly this function, which is what keeps the three
 * surfaces consistent.
 */
export function reduce(state: PersistedState, event: AppEvent): PersistedState {
  switch (event.type) {
    case 'order/placed': {
      const payments = event.payment ? [event.payment, ...state.payments] : state.payments
      const tables = state.tables.map((t) =>
        t.id === event.order.tableId && t.status === 'free' ? { ...t, status: 'occupied' as const } : t,
      )
      return { ...state, orders: [event.order, ...state.orders], payments, tables }
    }

    case 'order/status-changed':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === event.orderId
            ? {
                ...order,
                status: event.status,
                history: [...order.history, { status: event.status, at: event.at, by: event.by }],
              }
            : order,
        ),
      }

    case 'order/cancelled':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === event.orderId
            ? {
                ...order,
                status: 'cancelled',
                cancelReason: event.reason,
                history: [...order.history, { status: 'cancelled', at: event.at, by: event.by }],
              }
            : order,
        ),
      }

    case 'order/waiter-called':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === event.orderId ? { ...order, waiterCalledAt: event.at } : order,
        ),
      }

    case 'payment/status-changed': {
      const payments = state.payments.map((payment) =>
        payment.id === event.paymentId
          ? {
              ...payment,
              status: event.status,
              settledAt: event.status === 'paid' ? event.at : payment.settledAt,
              settledBy: event.by ?? payment.settledBy,
            }
          : payment,
      )
      const changed = payments.find((p) => p.id === event.paymentId)
      const orders = changed
        ? state.orders.map((order) =>
            order.id === changed.orderId ? { ...order, paymentStatus: event.status } : order,
          )
        : state.orders
      return { ...state, payments, orders }
    }

    case 'menu/item-upserted': {
      const exists = state.menuItems.some((i) => i.id === event.item.id)
      return {
        ...state,
        menuItems: exists
          ? state.menuItems.map((i) => (i.id === event.item.id ? event.item : i))
          : [...state.menuItems, event.item],
      }
    }

    case 'menu/item-deleted':
      return { ...state, menuItems: state.menuItems.filter((i) => i.id !== event.itemId) }

    case 'menu/items-reordered':
      return {
        ...state,
        menuItems: state.menuItems.map((item) => {
          const index = event.orderedIds.indexOf(item.id)
          return index === -1 ? item : { ...item, sortOrder: index + 1 }
        }),
      }

    case 'menu/category-upserted': {
      const exists = state.categories.some((c) => c.id === event.category.id)
      return {
        ...state,
        categories: exists
          ? state.categories.map((c) => (c.id === event.category.id ? event.category : c))
          : [...state.categories, event.category],
      }
    }

    case 'menu/category-deleted':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== event.categoryId),
        menuItems: state.menuItems.filter((i) => i.categoryId !== event.categoryId),
      }

    case 'menu/categories-reordered':
      return {
        ...state,
        categories: state.categories.map((category) => {
          const index = event.orderedIds.indexOf(category.id)
          return index === -1 ? category : { ...category, sortOrder: index + 1 }
        }),
      }

    case 'table/upserted': {
      const exists = state.tables.some((t) => t.id === event.table.id)
      return {
        ...state,
        tables: exists
          ? state.tables.map((t) => (t.id === event.table.id ? event.table : t))
          : [...state.tables, event.table],
      }
    }

    case 'table/deleted':
      return { ...state, tables: state.tables.filter((t) => t.id !== event.tableId) }

    case 'table/status-changed':
      return {
        ...state,
        tables: state.tables.map((t) => (t.id === event.tableId ? { ...t, status: event.status } : t)),
      }

    case 'staff/upserted': {
      const exists = state.staff.some((s) => s.id === event.user.id)
      return {
        ...state,
        staff: exists
          ? state.staff.map((s) => (s.id === event.user.id ? event.user : s))
          : [...state.staff, event.user],
      }
    }

    case 'staff/deleted':
      return { ...state, staff: state.staff.filter((s) => s.id !== event.userId) }

    case 'settings/updated':
      return { ...state, settings: event.settings }

    case 'demo/reset':
      return seedState()

    default:
      return state
  }
}
