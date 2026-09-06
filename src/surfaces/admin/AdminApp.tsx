import { AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Table2,
  UsersRound,
  UtensilsCrossed,
} from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Button } from '../../components/ui'
import { useAnnouncePresence } from '../../store/presence'
import { useStore } from '../../store/useStore'
import { ROLE_PERMISSIONS } from '../../data/restaurant'
import { LoginScreen } from './LoginScreen'
import { Dashboard } from './pages/Dashboard'
import { MenuManager } from './pages/MenuManager'
import { OrdersPage } from './pages/OrdersPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { StaffPage } from './pages/StaffPage'
import { TablesPage } from './pages/TablesPage'
import s from './admin.module.css'

/*
 * Absolute paths, deliberately. Relative `to` values resolve against the
 * currently matched child route, so a link to "reports" clicked while on
 * /admin/menu resolves to /admin/menu/reports and falls through to the
 * catch-all.
 */
const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'orders.view', end: true },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed, permission: 'menu.manage' },
  { to: '/admin/tables', label: 'Tables', icon: Table2, permission: 'tables.manage' },
  { to: '/admin/orders', label: 'Orders', icon: Receipt, permission: 'orders.view' },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'payments.view' },
  { to: '/admin/staff', label: 'Staff', icon: UsersRound, permission: 'staff.manage' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings.manage' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

export function AdminApp() {
  useAnnouncePresence('admin')
  const currentUserId = useStore((state) => state.currentUserId)
  const user = useStore((state) => state.staff.find((candidate) => candidate.id === state.currentUserId))
  const settings = useStore((state) => state.settings)
  const signOut = useStore((state) => state.signOut)

  if (!currentUserId || !user) return <LoginScreen />

  const permissions = ROLE_PERMISSIONS[user.role]
  const visibleNav = NAV.filter((item) => permissions.includes(item.permission))
  const can = (permission: string) => permissions.includes(permission)

  return (
    <div className={s.shell}>
      <nav className={s.sidebar}>
        <div className={s.sidebarBrand}>
          <span className={s.mark}>JK</span>
          <span>
            <span className={s.brandName} style={{ display: 'block' }}>
              {settings.name}
            </span>
            <span className={s.brandRole}>Back office</span>
          </span>
        </div>

        <p className={s.navLabel}>Manage</p>
        {visibleNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => [s.navItem, isActive ? s.navItemActive : ''].join(' ')}
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          )
        })}

        <div className={s.navFoot}>
          <div className={s.userRow}>
            <span className={s.avatar}>{initials(user.name)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className={s.userName} style={{ display: 'block' }}>
                {user.name}
              </span>
              <span className={s.userRole}>{user.role}</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" block onClick={signOut}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </nav>

      <main className={s.content}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="menu" element={can('menu.manage') ? <MenuManager /> : <Navigate to="/admin" replace />} />
            <Route path="tables" element={can('tables.manage') ? <TablesPage /> : <Navigate to="/admin" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route
              path="payments"
              element={can('payments.view') ? <PaymentsPage /> : <Navigate to="/admin" replace />}
            />
            <Route path="staff" element={can('staff.manage') ? <StaffPage /> : <Navigate to="/admin" replace />} />
            <Route
              path="reports"
              element={can('reports.view') ? <ReportsPage /> : <Navigate to="/admin" replace />}
            />
            <Route
              path="settings"
              element={can('settings.manage') ? <SettingsPage /> : <Navigate to="/admin" replace />}
            />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
