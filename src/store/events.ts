import type {
  Category,
  ID,
  MenuItem,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  RestaurantSettings,
  RestaurantTable,
  StaffUser,
  TableStatus,
} from '../types'

/**
 * Every mutation in the prototype is expressed as an event. Events are applied
 * locally and broadcast to other surfaces, which apply the identical reducer —
 * so the customer iPad, the kitchen display and the admin dashboard converge on
 * the same state without any of them talking to each other directly.
 *
 * In production these become server-authored events over a websocket. The shape
 * is deliberately close to what an API would emit.
 */
export type AppEvent =
  | { type: 'order/placed'; order: Order; payment: Payment | null }
  | { type: 'order/status-changed'; orderId: ID; status: OrderStatus; by: string; at: number }
  | { type: 'order/cancelled'; orderId: ID; reason: string; by: string; at: number }
  | { type: 'order/waiter-called'; orderId: ID; at: number }
  | { type: 'payment/status-changed'; paymentId: ID; status: PaymentStatus; by?: string; at: number }
  | { type: 'menu/item-upserted'; item: MenuItem }
  | { type: 'menu/item-deleted'; itemId: ID }
  | { type: 'menu/items-reordered'; categoryId: ID; orderedIds: ID[] }
  | { type: 'menu/category-upserted'; category: Category }
  | { type: 'menu/category-deleted'; categoryId: ID }
  | { type: 'menu/categories-reordered'; orderedIds: ID[] }
  | { type: 'table/upserted'; table: RestaurantTable }
  | { type: 'table/deleted'; tableId: ID }
  | { type: 'table/status-changed'; tableId: ID; status: TableStatus }
  | { type: 'staff/upserted'; user: StaffUser }
  | { type: 'staff/deleted'; userId: ID }
  | { type: 'settings/updated'; settings: RestaurantSettings }
  | { type: 'demo/reset' }

export interface EnvelopedEvent {
  /** Identifies the tab that produced the event, so senders ignore their own echo. */
  sourceId: string
  event: AppEvent
  at: number
}
