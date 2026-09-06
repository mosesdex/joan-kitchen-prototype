import { describe, expect, it } from 'vitest'
import { calculateTotals, estimateEta, lineTotal, lineUnitPrice, subtotalOf } from '../lib/pricing'
import { applyRate, naira, nairaCompact } from '../lib/money'
import type { OrderItem } from '../types'

const line = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'line_1',
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

const settings = { vatRate: 7.5, serviceChargeRate: 5 }

describe('line pricing', () => {
  it('adds every selected option to the unit price', () => {
    const item = line({
      selectedOptions: [
        { groupId: 'g', groupName: 'Protein', optionId: 'o1', optionName: 'Chicken', priceDelta: 250000 },
        { groupId: 'g2', groupName: 'Sides', optionId: 'o2', optionName: 'Dodo', priceDelta: 100000 },
      ],
    })
    expect(lineUnitPrice(item)).toBe(730000)
  })

  it('handles negative option deltas', () => {
    const item = line({
      selectedOptions: [
        { groupId: 'g', groupName: 'Swallow', optionId: 'o', optionName: 'Eba', priceDelta: -20000 },
      ],
    })
    expect(lineUnitPrice(item)).toBe(360000)
  })

  it('multiplies by quantity', () => {
    expect(lineTotal(line({ quantity: 3 }))).toBe(1140000)
  })

  it('sums a cart', () => {
    expect(subtotalOf([line(), line({ id: 'line_2', quantity: 2 })])).toBe(1140000)
  })
})

describe('bill totals', () => {
  it('applies VAT and service charge to the subtotal, not to each other', () => {
    const totals = calculateTotals([line()], settings)
    expect(totals.subtotal).toBe(380000)
    expect(totals.vat).toBe(28500)
    expect(totals.serviceCharge).toBe(19000)
    expect(totals.total).toBe(427500)
  })

  it('always prints lines that add up to the printed total', () => {
    // A subtotal that does not divide cleanly by either rate.
    const totals = calculateTotals([line({ unitPrice: 333333 })], settings)
    expect(totals.subtotal + totals.vat + totals.serviceCharge).toBe(totals.total)
  })

  it('is zero for an empty cart', () => {
    expect(calculateTotals([], settings)).toEqual({
      subtotal: 0,
      vat: 0,
      serviceCharge: 0,
      total: 0,
    })
  })

  it('rounds each rate half-up to whole kobo', () => {
    expect(applyRate(100, 7.5)).toBe(8)
    expect(applyRate(1, 7.5)).toBe(0)
  })
})

describe('eta', () => {
  it('is zero for an empty order', () => {
    expect(estimateEta([])).toBe(0)
  })

  it('uses the longest dish as the floor', () => {
    expect(estimateEta([{ prepMinutes: 18, quantity: 1 }])).toBe(18)
  })

  it('adds a penalty per additional unit rather than summing prep times', () => {
    const eta = estimateEta([
      { prepMinutes: 18, quantity: 2 },
      { prepMinutes: 12, quantity: 1 },
    ])
    // longest 18 + 2 extra units × 1.5
    expect(eta).toBe(21)
  })
})

describe('money formatting', () => {
  it('formats kobo as naira', () => {
    expect(naira(650000)).toBe('₦6,500')
  })

  it('compacts large values for dashboard tiles', () => {
    expect(nairaCompact(120_000_000)).toBe('₦1.2m')
    expect(nairaCompact(500_000)).toBe('₦5.0k')
  })
})
