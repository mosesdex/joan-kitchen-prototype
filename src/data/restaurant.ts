import type { RestaurantSettings, RestaurantTable, StaffUser } from '../types'
import { MINUTE } from '../lib/time'

export const SETTINGS: RestaurantSettings = {
  name: 'Joan Kitchen',
  tagline: 'Nigerian kitchen, open fire, no shortcuts',
  address: '14B Adeola Odeku Street, Victoria Island, Lagos',
  phone: '+234 801 234 5678',
  currency: 'NGN',
  vatRate: 7.5,
  serviceChargeRate: 5,
  openingHours: [
    { day: 'Monday', open: '11:00', close: '22:00', closed: false },
    { day: 'Tuesday', open: '11:00', close: '22:00', closed: false },
    { day: 'Wednesday', open: '11:00', close: '22:00', closed: false },
    { day: 'Thursday', open: '11:00', close: '23:00', closed: false },
    { day: 'Friday', open: '11:00', close: '23:59', closed: false },
    { day: 'Saturday', open: '12:00', close: '23:59', closed: false },
    { day: 'Sunday', open: '12:00', close: '21:00', closed: false },
  ],
  bankName: 'Providus Bank',
  bankAccountName: 'Joan Kitchen Limited',
  bankAccountNumber: '5401882736',
  kitchenSoundEnabled: true,
  ticketWarningMinutes: 12,
  ticketDangerMinutes: 20,
}

const zone = (
  prefix: string,
  zoneName: string,
  count: number,
  seats: number[],
  start = 1,
): RestaurantTable[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `tbl_${prefix}${start + i}`,
    label: `${prefix}${start + i}`,
    zone: zoneName,
    seats: seats[i % seats.length],
    status: 'free' as const,
    pairingCode: ['4K2P', '7QX9', 'M3RT', 'B8VN', 'Z5LC', 'H6DW', 'J9FA', 'Q2NE'][
      (start + i) % 8
    ],
  }))

export const TABLES: RestaurantTable[] = [
  ...zone('T', 'Main hall', 10, [2, 4, 4, 6]),
  ...zone('P', 'Terrace', 6, [2, 4, 4]),
  ...zone('B', 'Bar', 5, [2, 2, 3]),
  ...zone('V', 'Private room', 3, [8, 10, 12]),
]

// A few tables start occupied so the admin table board is not uniformly empty.
;['tbl_T3', 'tbl_T7', 'tbl_P2', 'tbl_B1'].forEach((id) => {
  const t = TABLES.find((x) => x.id === id)
  if (t) t.status = 'occupied'
})
const cleaning = TABLES.find((x) => x.id === 'tbl_T9')
if (cleaning) cleaning.status = 'needs-cleaning'
const reserved = TABLES.find((x) => x.id === 'tbl_V2')
if (reserved) reserved.status = 'reserved'

const now = Date.now()

export const STAFF: StaffUser[] = [
  {
    id: 'stf_joan',
    name: 'Joan Adeyemi',
    email: 'joan@joankitchen.ng',
    role: 'owner',
    active: true,
    lastActiveAt: now - 4 * MINUTE,
    pin: '1234',
  },
  {
    id: 'stf_tunde',
    name: 'Tunde Bakare',
    email: 'tunde@joankitchen.ng',
    role: 'manager',
    active: true,
    lastActiveAt: now - 22 * MINUTE,
    pin: '2345',
  },
  {
    id: 'stf_amaka',
    name: 'Amaka Nwosu',
    email: 'amaka@joankitchen.ng',
    role: 'kitchen',
    active: true,
    lastActiveAt: now - 2 * MINUTE,
    pin: '3456',
  },
  {
    id: 'stf_ibrahim',
    name: 'Ibrahim Yusuf',
    email: 'ibrahim@joankitchen.ng',
    role: 'kitchen',
    active: true,
    lastActiveAt: now - 9 * MINUTE,
    pin: '4567',
  },
  {
    id: 'stf_chidi',
    name: 'Chidi Okonkwo',
    email: 'chidi@joankitchen.ng',
    role: 'waiter',
    active: true,
    lastActiveAt: now - 1 * MINUTE,
    pin: '5678',
  },
  {
    id: 'stf_bisi',
    name: 'Bisi Ogundele',
    email: 'bisi@joankitchen.ng',
    role: 'waiter',
    active: false,
    lastActiveAt: now - 6 * 24 * 60 * MINUTE,
    pin: '6789',
  },
]

export const ROLE_PERMISSIONS: Record<StaffUser['role'], string[]> = {
  owner: [
    'menu.manage',
    'tables.manage',
    'orders.view',
    'orders.manage',
    'payments.view',
    'staff.manage',
    'reports.view',
    'settings.manage',
  ],
  manager: [
    'menu.manage',
    'tables.manage',
    'orders.view',
    'orders.manage',
    'payments.view',
    'reports.view',
  ],
  kitchen: ['orders.view', 'orders.manage'],
  waiter: ['orders.view', 'orders.manage', 'tables.manage'],
}
