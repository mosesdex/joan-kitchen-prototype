import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store/useStore'
import { makeId } from '../lib/id'
import type { OrderItem } from '../types'

const line = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: makeId('line'),
  menuItemId: 'itm_jollof',
  name: 'Party jollof rice',
  unitPrice: 380000,
  quantity: 1,
  selectedOptions: [],
  notes: '',
  imageUrl: 'jollof-rice',
  imageTone: 'ember',
  ...overrides,
})

describe('cart', () => {
  beforeEach(() => {
    useStore.getState().clearCart()
  })

  it('merges an identical dish with identical options into one line', () => {
    const { addToCart } = useStore.getState()
    addToCart(line())
    addToCart(line())
    const cart = useStore.getState().cart
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(2)
  })

  it('keeps lines separate when the options differ', () => {
    const { addToCart } = useStore.getState()
    addToCart(line())
    addToCart(
      line({
        selectedOptions: [
          { groupId: 'g', groupName: 'Protein', optionId: 'o', optionName: 'Chicken', priceDelta: 250000 },
        ],
      }),
    )
    expect(useStore.getState().cart).toHaveLength(2)
  })

  it('keeps lines separate when the notes differ', () => {
    const { addToCart } = useStore.getState()
    addToCart(line())
    addToCart(line({ notes: 'No pepper' }))
    expect(useStore.getState().cart).toHaveLength(2)
  })

  it('removes and updates lines by id', () => {
    const { addToCart } = useStore.getState()
    const first = line()
    addToCart(first)
    const id = useStore.getState().cart[0].id
    useStore.getState().updateCartItem(id, { quantity: 4 })
    expect(useStore.getState().cart[0].quantity).toBe(4)
    useStore.getState().removeCartItem(id)
    expect(useStore.getState().cart).toHaveLength(0)
  })
})

describe('placeOrder', () => {
  beforeEach(() => {
    useStore.getState().clearCart()
  })

  it('creates an order with priced totals, empties the cart and records the session', () => {
    const store = useStore.getState()
    store.setActiveTable(store.tables[0].id)
    store.addToCart(line({ quantity: 2 }))

    const order = useStore.getState().placeOrder('bank-transfer')

    expect(order.items).toHaveLength(1)
    expect(order.totals.subtotal).toBe(760000)
    expect(order.totals.total).toBe(
      order.totals.subtotal + order.totals.vat + order.totals.serviceCharge,
    )
    expect(order.status).toBe('new')
    expect(order.tableLabel).toBe(store.tables[0].label)

    const after = useStore.getState()
    expect(after.cart).toHaveLength(0)
    expect(after.sessionOrderIds[0]).toBe(order.id)
    expect(after.orders.find((o) => o.id === order.id)).toBeTruthy()
  })

  it('marks a bank transfer as awaiting confirmation and pay-at-table as unpaid', () => {
    const store = useStore.getState()
    store.setActiveTable(store.tables[0].id)

    store.addToCart(line())
    const transfer = useStore.getState().placeOrder('bank-transfer')
    expect(transfer.paymentStatus).toBe('awaiting-confirmation')

    useStore.getState().addToCart(line())
    const atTable = useStore.getState().placeOrder('pay-at-table')
    expect(atTable.paymentStatus).toBe('unpaid')
  })
})
