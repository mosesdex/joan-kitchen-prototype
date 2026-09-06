import type { OrderItem, OrderTotals, RestaurantSettings } from '../types'
import { applyRate } from './money'

/** Unit price including every selected option, in kobo. */
export function lineUnitPrice(item: Pick<OrderItem, 'unitPrice' | 'selectedOptions'>): number {
  return item.selectedOptions.reduce((sum, o) => sum + o.priceDelta, item.unitPrice)
}

/** Unit price multiplied by quantity. */
export function lineTotal(item: Pick<OrderItem, 'unitPrice' | 'selectedOptions' | 'quantity'>): number {
  return lineUnitPrice(item) * item.quantity
}

export function subtotalOf(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0)
}

/**
 * VAT and service charge are both computed on the subtotal — service charge is
 * not itself taxed — and each is rounded to whole kobo so the printed lines
 * always sum to the printed total.
 */
export function calculateTotals(
  items: OrderItem[],
  settings: Pick<RestaurantSettings, 'vatRate' | 'serviceChargeRate'>,
): OrderTotals {
  const subtotal = subtotalOf(items)
  const vat = applyRate(subtotal, settings.vatRate)
  const serviceCharge = applyRate(subtotal, settings.serviceChargeRate)
  return { subtotal, vat, serviceCharge, total: subtotal + vat + serviceCharge }
}

/**
 * Kitchen throughput is parallel, not serial: the longest item sets the pace,
 * with a small penalty for each additional line so a 12-item table is not
 * quoted the same wait as a single plate.
 */
export function estimateEta(items: { prepMinutes: number; quantity: number }[]): number {
  if (items.length === 0) return 0
  const longest = Math.max(...items.map((i) => i.prepMinutes))
  const units = items.reduce((sum, i) => sum + i.quantity, 0)
  return Math.round(longest + Math.max(0, units - 1) * 1.5)
}
