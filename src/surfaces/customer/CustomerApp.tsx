import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Receipt, Search, ShoppingBag, Table2, X } from 'lucide-react'
import { useToast } from '../../components/Toaster'
import { Button } from '../../components/ui'
import { playSoftPing } from '../../lib/sound'
import { useAutoKitchen } from '../../store/autoKitchen'
import { useAnnouncePresence } from '../../store/presence'
import { useStore } from '../../store/useStore'
import type { MenuItem, Order, PaymentMethod } from '../../types'
import { CartDrawer } from './CartDrawer'
import { CheckoutScreen } from './CheckoutScreen'
import { ConfirmationScreen } from './ConfirmationScreen'
import { ItemSheet } from './ItemSheet'
import { MenuScreen } from './MenuScreen'
import { PaymentScreen } from './PaymentScreen'
import { TableGate } from './TableGate'
import { TrackingScreen } from './TrackingScreen'
import s from './customer.module.css'

type View = 'menu' | 'checkout' | 'payment' | 'confirmation' | 'tracking'

export function CustomerApp() {
  useAnnouncePresence('customer')
  useAutoKitchen(true)

  const activeTableId = useStore((state) => state.activeTableId)
  const tables = useStore((state) => state.tables)
  const cart = useStore((state) => state.cart)
  const addToCart = useStore((state) => state.addToCart)
  const setActiveTable = useStore((state) => state.setActiveTable)
  const sessionOrderIds = useStore((state) => state.sessionOrderIds)
  const orders = useStore((state) => state.orders)
  const settings = useStore((state) => state.settings)
  const soundEnabled = useStore((state) => state.soundEnabled)
  const toast = useToast()

  const [view, setView] = useState<View>('menu')
  const [search, setSearch] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const table = tables.find((t) => t.id === activeTableId)
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const liveOrder = sessionOrderIds
    .map((id) => orders.find((order) => order.id === id))
    .find((order) => order && order.status !== 'served' && order.status !== 'cancelled')

  if (!table) {
    return <TableGate onConfirm={() => setView('menu')} />
  }

  if (view === 'checkout') {
    return (
      <CheckoutScreen
        onBack={() => setView('menu')}
        onPlaced={(order: Order, method: PaymentMethod) => {
          setPlacedOrder(order)
          setView(method === 'bank-transfer' ? 'payment' : 'confirmation')
          if (method === 'pay-at-table') {
            toast.success('Sent to the kitchen', `Order ${order.reference} is on the pass.`)
            if (soundEnabled) playSoftPing()
          }
        }}
      />
    )
  }

  if (view === 'payment' && placedOrder) {
    return <PaymentScreen order={placedOrder} onPaid={() => setView('confirmation')} />
  }

  if (view === 'confirmation' && placedOrder) {
    const current = orders.find((order) => order.id === placedOrder.id) ?? placedOrder
    return (
      <ConfirmationScreen
        order={current}
        onTrack={() => setView('tracking')}
        onAddMore={() => setView('menu')}
      />
    )
  }

  if (view === 'tracking') {
    return <TrackingScreen onBack={() => setView('menu')} />
  }

  return (
    <div className={s.app}>
      <header className={s.topbar}>
        <div className={s.brand}>
          <span className={s.mark}>JK</span>
          <span>
            <span className={s.brandName} style={{ display: 'block' }}>
              {settings.name}
            </span>
            <span className={s.brandTag}>{settings.tagline}</span>
          </span>
        </div>

        <button
          className={s.tablePill}
          onClick={() => setActiveTable(null)}
          title="Change table"
        >
          <Table2 size={13} /> Table {table.label}
        </button>

        <div className={s.search}>
          <Search size={15} className={s.searchIcon} />
          <input
            className={s.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the menu — jollof, suya, zobo…"
            aria-label="Search the menu"
          />
          {search ? (
            <button className={s.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className={s.topActions}>
          <Button
            variant="secondary"
            iconOnly
            className={s.trackButton}
            onClick={() => setView('tracking')}
            aria-label="Your orders"
          >
            <Receipt size={17} />
            {liveOrder ? <span className={s.trackDot} /> : null}
          </Button>

          <button className={s.cartButton} onClick={() => setCartOpen(true)}>
            <ShoppingBag size={17} />
            Order
            {cartCount > 0 ? <span className={s.cartCount}>{cartCount}</span> : null}
          </button>
        </div>
      </header>

      <MenuScreen search={search} onOpenItem={setActiveItem} />

      <AnimatePresence>
        {activeItem ? (
          <ItemSheet
            key={activeItem.id}
            item={activeItem}
            onClose={() => setActiveItem(null)}
            onAdd={(line) => {
              addToCart(line)
              setActiveItem(null)
              toast.success(
                `${line.name} added`,
                `${line.quantity} × on table ${table.label}`,
              )
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen ? (
          <CartDrawer
            onClose={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false)
              setView('checkout')
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {cartCount > 0 && !cartOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 60 }}
          >
            <Button variant="primary" size="lg" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={17} /> Review order · {cartCount}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
