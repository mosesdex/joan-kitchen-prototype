import { describe, expect, it } from 'vitest'
import { reduce } from '../store/reducer'
import { seedState } from '../store/seedState'
import type { PersistedState } from '../store/persist'
import type { Order, Payment } from '../types'

const base = (): PersistedState => seedState()

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 'ord_test',
  reference: 'JK-0001',
  tableId: 'tbl_T1',
  tableLabel: 'T1',
  items: [],
  status: 'new',
  totals: { subtotal: 100000, vat: 7500, serviceCharge: 5000, total: 112500 },
  note: '',
  paymentId: 'pay_test',
  paymentMethod: 'bank-transfer',
  paymentStatus: 'awaiting-confirmation',
  placedAt: Date.now(),
  history: [{ status: 'new', at: Date.now(), by: 'Guest' }],
  etaMinutes: 14,
  ...overrides,
})

const payment = (): Payment => ({
  id: 'pay_test',
  orderId: 'ord_test',
  method: 'bank-transfer',
  status: 'awaiting-confirmation',
  amount: 112500,
  reference: 'ABCD1234',
  createdAt: Date.now(),
})

describe('order/placed', () => {
  it('adds the order and its payment', () => {
    const next = reduce(base(), { type: 'order/placed', order: order(), payment: payment() })
    expect(next.orders[0].id).toBe('ord_test')
    expect(next.payments[0].id).toBe('pay_test')
  })

  it('marks a free table occupied but leaves other statuses alone', () => {
    const state = base()
    const cleaning = state.tables.find((t) => t.status === 'needs-cleaning')!
    const free = state.tables.find((t) => t.status === 'free')!

    const occupied = reduce(state, {
      type: 'order/placed',
      order: order({ tableId: free.id }),
      payment: null,
    })
    expect(occupied.tables.find((t) => t.id === free.id)?.status).toBe('occupied')

    const untouched = reduce(state, {
      type: 'order/placed',
      order: order({ tableId: cleaning.id }),
      payment: null,
    })
    expect(untouched.tables.find((t) => t.id === cleaning.id)?.status).toBe('needs-cleaning')
  })
})

describe('order/status-changed', () => {
  it('sets the status and appends to the history', () => {
    const withOrder = reduce(base(), { type: 'order/placed', order: order(), payment: null })
    const next = reduce(withOrder, {
      type: 'order/status-changed',
      orderId: 'ord_test',
      status: 'preparing',
      by: 'Amaka Nwosu',
      at: 1_700_000_000_000,
    })
    const updated = next.orders.find((o) => o.id === 'ord_test')!
    expect(updated.status).toBe('preparing')
    expect(updated.history.at(-1)).toEqual({
      status: 'preparing',
      at: 1_700_000_000_000,
      by: 'Amaka Nwosu',
    })
  })

  it('ignores an unknown order id', () => {
    const state = base()
    const next = reduce(state, {
      type: 'order/status-changed',
      orderId: 'nope',
      status: 'ready',
      by: 'x',
      at: 1,
    })
    expect(next.orders).toEqual(state.orders)
  })
})

describe('payment/status-changed', () => {
  it('updates the payment and mirrors it onto the order', () => {
    let state = reduce(base(), { type: 'order/placed', order: order(), payment: payment() })
    state = reduce(state, {
      type: 'payment/status-changed',
      paymentId: 'pay_test',
      status: 'paid',
      at: 1_700_000_000_000,
      by: 'Chidi Okonkwo',
    })
    expect(state.payments.find((p) => p.id === 'pay_test')?.status).toBe('paid')
    expect(state.orders.find((o) => o.id === 'ord_test')?.paymentStatus).toBe('paid')
  })
})

describe('menu editing', () => {
  it('updates an existing item rather than duplicating it', () => {
    const state = base()
    const item = state.menuItems[0]
    const next = reduce(state, {
      type: 'menu/item-upserted',
      item: { ...item, name: 'Renamed' },
    })
    expect(next.menuItems).toHaveLength(state.menuItems.length)
    expect(next.menuItems.find((i) => i.id === item.id)?.name).toBe('Renamed')
  })

  it('deleting a category deletes the dishes inside it', () => {
    const state = base()
    const categoryId = state.categories[0].id
    const inside = state.menuItems.filter((i) => i.categoryId === categoryId).length
    expect(inside).toBeGreaterThan(0)

    const next = reduce(state, { type: 'menu/category-deleted', categoryId })
    expect(next.categories.some((c) => c.id === categoryId)).toBe(false)
    expect(next.menuItems.filter((i) => i.categoryId === categoryId)).toHaveLength(0)
    expect(next.menuItems).toHaveLength(state.menuItems.length - inside)
  })

  it('reordering rewrites sortOrder to match the given order', () => {
    const state = base()
    const categoryId = state.categories[0].id
    const ids = state.menuItems.filter((i) => i.categoryId === categoryId).map((i) => i.id)
    const reversed = [...ids].reverse()

    const next = reduce(state, { type: 'menu/items-reordered', categoryId, orderedIds: reversed })
    const sorted = next.menuItems
      .filter((i) => i.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.id)
    expect(sorted).toEqual(reversed)
  })
})

describe('demo/reset', () => {
  it('returns a fresh restaurant', () => {
    const dirty = reduce(base(), { type: 'menu/item-deleted', itemId: base().menuItems[0].id })
    const reset = reduce(dirty, { type: 'demo/reset' })
    expect(reset.menuItems.length).toBe(base().menuItems.length)
  })
})
