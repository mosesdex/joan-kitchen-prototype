/** Domain model for the Joan Kitchen prototype. */

export type ID = string

/* ---------------- menu ---------------- */

export type SpiceLevel = 0 | 1 | 2 | 3

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'contains-nuts'
  | 'contains-gluten'
  | 'contains-dairy'
  | 'contains-shellfish'
  | 'halal'

export interface Category {
  id: ID
  name: string
  /** Short line shown under the category heading on the customer menu. */
  blurb: string
  /** Lucide icon name used on the category rail. */
  icon: string
  sortOrder: number
  active: boolean
}

export interface Option {
  id: ID
  name: string
  /** Price delta in kobo. May be negative. */
  priceDelta: number
  available: boolean
}

export interface OptionGroup {
  id: ID
  name: string
  /** `single` renders radios, `multi` renders checkboxes. */
  type: 'single' | 'multi'
  required: boolean
  /** Only meaningful for `multi` groups. */
  maxSelections?: number
  options: Option[]
}

export interface MenuItem {
  id: ID
  categoryId: ID
  name: string
  description: string
  /** Base price in kobo — all money in this app is integer kobo. */
  price: number
  imageUrl: string
  /** Deterministic fallback tint when the remote image cannot load. */
  imageTone: 'ember' | 'clay' | 'palm' | 'gold' | 'char' | 'cream'
  spiceLevel: SpiceLevel
  dietary: DietaryTag[]
  optionGroups: OptionGroup[]
  available: boolean
  featured: boolean
  /** Minutes the kitchen typically needs. Drives the customer ETA. */
  prepMinutes: number
  sortOrder: number
}

/* ---------------- tables ---------------- */

export type TableStatus = 'free' | 'occupied' | 'needs-cleaning' | 'reserved'

export interface RestaurantTable {
  id: ID
  /** Human label shown to guests and kitchen, e.g. "T12". */
  label: string
  zone: string
  seats: number
  status: TableStatus
  /** Code a guest types on the iPad to claim the table. */
  pairingCode: string
}

/* ---------------- orders ---------------- */

export type OrderStatus =
  | 'new'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled'

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'new',
  'accepted',
  'preparing',
  'ready',
]

export interface SelectedOption {
  groupId: ID
  groupName: string
  optionId: ID
  optionName: string
  priceDelta: number
}

export interface OrderItem {
  id: ID
  menuItemId: ID
  name: string
  /** Unit base price at the time of ordering, in kobo. */
  unitPrice: number
  quantity: number
  selectedOptions: SelectedOption[]
  notes: string
  imageUrl: string
  imageTone: MenuItem['imageTone']
}

export type PaymentMethod = 'bank-transfer' | 'pay-at-table'
export type PaymentStatus = 'unpaid' | 'awaiting-confirmation' | 'paid' | 'refunded'

export interface Payment {
  id: ID
  orderId: ID
  method: PaymentMethod
  status: PaymentStatus
  /** Total charged, in kobo. */
  amount: number
  /** Pseudo bank reference shown on the transfer screen. */
  reference: string
  createdAt: number
  settledAt?: number
  /** Staff member who confirmed a pay-at-table settlement. */
  settledBy?: string
}

export interface OrderTotals {
  subtotal: number
  vat: number
  serviceCharge: number
  total: number
}

export interface StatusEvent {
  status: OrderStatus
  at: number
  /** Staff name, or "Guest" / "Auto kitchen". */
  by: string
}

export interface Order {
  id: ID
  /** Short human reference, e.g. "JK-4821". */
  reference: string
  tableId: ID
  tableLabel: string
  items: OrderItem[]
  status: OrderStatus
  totals: OrderTotals
  /** Order-level note from the guest, distinct from per-item notes. */
  note: string
  paymentId: ID | null
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  placedAt: number
  history: StatusEvent[]
  cancelReason?: string
  /** Estimated minutes to ready, computed at placement. */
  etaMinutes: number
  /** Set when a guest presses "call waiter" from the tracking screen. */
  waiterCalledAt?: number
}

/* ---------------- staff ---------------- */

export type StaffRole = 'owner' | 'manager' | 'kitchen' | 'waiter'

export type Permission =
  | 'menu.manage'
  | 'tables.manage'
  | 'orders.view'
  | 'orders.manage'
  | 'payments.view'
  | 'staff.manage'
  | 'reports.view'
  | 'settings.manage'

export interface StaffUser {
  id: ID
  name: string
  email: string
  role: StaffRole
  active: boolean
  lastActiveAt: number
  /** Demo-only. Never do this in production. */
  pin: string
}

/* ---------------- settings ---------------- */

export interface RestaurantSettings {
  name: string
  tagline: string
  address: string
  phone: string
  currency: string
  /** Percentage, e.g. 7.5 */
  vatRate: number
  /** Percentage, e.g. 5 */
  serviceChargeRate: number
  openingHours: { day: string; open: string; close: string; closed: boolean }[]
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  kitchenSoundEnabled: boolean
  /** Minutes before a kitchen ticket turns red. */
  ticketWarningMinutes: number
  ticketDangerMinutes: number
}

/* ---------------- sessions ---------------- */

export interface TableSession {
  tableId: ID
  startedAt: number
  orderIds: ID[]
}
