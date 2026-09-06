import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Bell, BellOff, ChefHat, CircleCheck, CircleSlash, Inbox, Volume2 } from 'lucide-react'
import { Badge, Button, EmptyState } from '../../components/ui'
import { useToast } from '../../components/Toaster'
import { useNow, usePrevious } from '../../lib/hooks'
import { naira } from '../../lib/money'
import { playNewOrderChime, primeAudio } from '../../lib/sound'
import { clockTime, elapsedPrecise, startOfDay } from '../../lib/time'
import { useAnnouncePresence } from '../../store/presence'
import { useStore } from '../../store/useStore'
import type { Order, OrderStatus } from '../../types'
import { Ticket } from './Ticket'
import { TicketDetail } from './TicketDetail'
import s from './kitchen.module.css'

const COLUMNS: { status: OrderStatus; name: string; colour: string }[] = [
  { status: 'new', name: 'New', colour: 'var(--accent)' },
  { status: 'accepted', name: 'Accepted', colour: 'var(--info)' },
  { status: 'preparing', name: 'Preparing', colour: 'var(--warning)' },
  { status: 'ready', name: 'Ready', colour: 'var(--success)' },
]

type Tab = 'board' | 'completed' | 'cancelled'

/** The chef on shift in this prototype. Production reads this from the session. */
const ON_SHIFT = 'Amaka Nwosu'

export function KitchenApp() {
  useAnnouncePresence('kitchen')
  const now = useNow(1000)
  const toast = useToast()

  const orders = useStore((state) => state.orders)
  const settings = useStore((state) => state.settings)
  const soundEnabled = useStore((state) => state.soundEnabled)
  const setSoundEnabled = useStore((state) => state.setSoundEnabled)
  const advanceOrder = useStore((state) => state.advanceOrder)
  const cancelOrder = useStore((state) => state.cancelOrder)

  const [tab, setTab] = useState<Tab>('board')
  const [openId, setOpenId] = useState<string | null>(null)

  const active = useMemo(
    () => orders.filter((o) => COLUMNS.some((c) => c.status === o.status)),
    [orders],
  )
  const todayFrom = startOfDay(Date.now())
  const completed = useMemo(
    () => orders.filter((o) => o.status === 'served' && o.placedAt >= todayFrom),
    [orders, todayFrom],
  )
  const cancelled = useMemo(
    () => orders.filter((o) => o.status === 'cancelled' && o.placedAt >= todayFrom),
    [orders, todayFrom],
  )

  // New tickets announce themselves: a chime plus a toast, so a busy pass never
  // relies on someone happening to look at the screen.
  const newIds = active.filter((o) => o.status === 'new').map((o) => o.id)
  const previousNewIds = usePrevious(newIds)
  useEffect(() => {
    if (!previousNewIds) return
    const arrived = newIds.filter((id) => !previousNewIds.includes(id))
    if (arrived.length === 0) return
    const order = orders.find((o) => o.id === arrived[0])
    if (soundEnabled) playNewOrderChime()
    toast.info(
      `New order · table ${order?.tableLabel ?? '—'}`,
      `${order?.items.length ?? 0} items · ${order?.reference ?? ''}`,
    )
  }, [newIds.join('|')])

  useEffect(() => {
    const prime = () => primeAudio()
    window.addEventListener('pointerdown', prime, { once: true })
    return () => window.removeEventListener('pointerdown', prime)
  }, [])

  const openOrder = orders.find((o) => o.id === openId) ?? null
  const oldest = active.reduce<Order | null>(
    (worst, order) => (!worst || order.placedAt < worst.placedAt ? order : worst),
    null,
  )

  const advance = (order: Order, status: OrderStatus) => {
    advanceOrder(order.id, status, ON_SHIFT)
    if (status === 'ready') toast.success(`Table ${order.tableLabel} is ready`, order.reference)
  }

  return (
    <div className={s.app}>
      <header className={s.topbar}>
        <div className={s.brand}>
          <span className={s.mark}>
            <ChefHat size={18} />
          </span>
          <span>
            <span className={s.title} style={{ display: 'block' }}>
              Kitchen display
            </span>
            <span className={s.subtitle}>{settings.name} · {ON_SHIFT} on shift</span>
          </span>
        </div>

        <div className={s.stats}>
          <div className={s.stat}>
            <p className={s.statValue}>{active.length}</p>
            <p className={s.statLabel}>on the pass</p>
          </div>
          <div className={s.stat}>
            <p className={s.statValue}>{oldest ? elapsedPrecise(oldest.placedAt, now) : '—'}</p>
            <p className={s.statLabel}>oldest ticket</p>
          </div>
          <div className={s.stat}>
            <p className={s.statValue}>{completed.length}</p>
            <p className={s.statLabel}>served today</p>
          </div>
        </div>

        <div className={s.topRight}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              primeAudio()
              setSoundEnabled(!soundEnabled)
            }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <BellOff size={14} />}
            {soundEnabled ? 'Sound on' : 'Sound off'}
          </Button>
          <span className={s.clock}>{clockTime(now)}</span>
        </div>
      </header>

      <nav className={s.tabs}>
        <button
          className={[s.tab, tab === 'board' ? s.tabActive : ''].join(' ')}
          onClick={() => setTab('board')}
        >
          <Bell size={14} /> Active <span className={s.tabCount}>{active.length}</span>
        </button>
        <button
          className={[s.tab, tab === 'completed' ? s.tabActive : ''].join(' ')}
          onClick={() => setTab('completed')}
        >
          <CircleCheck size={14} /> Completed <span className={s.tabCount}>{completed.length}</span>
        </button>
        <button
          className={[s.tab, tab === 'cancelled' ? s.tabActive : ''].join(' ')}
          onClick={() => setTab('cancelled')}
        >
          <CircleSlash size={14} /> Cancelled <span className={s.tabCount}>{cancelled.length}</span>
        </button>
      </nav>

      {tab === 'board' ? (
        <div className={s.board}>
          {COLUMNS.map((column) => {
            const tickets = active
              .filter((order) => order.status === column.status)
              .sort((a, b) => a.placedAt - b.placedAt)
            return (
              <section className={s.column} key={column.status}>
                <header className={s.columnHead}>
                  <span className={s.columnDot} style={{ background: column.colour }} />
                  <h2 className={s.columnName}>{column.name}</h2>
                  <span className={s.columnCount}>{tickets.length}</span>
                </header>
                <div className={s.columnScroll}>
                  <AnimatePresence mode="popLayout">
                    {tickets.map((order) => (
                      <Ticket
                        key={order.id}
                        order={order}
                        now={now}
                        settings={settings}
                        onOpen={() => setOpenId(order.id)}
                        onAdvance={(status) => advance(order, status)}
                      />
                    ))}
                  </AnimatePresence>
                  {tickets.length === 0 ? (
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: 'var(--space-6) 0',
                      }}
                    >
                      Nothing here
                    </p>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className={s.listWrap}>
          <OrderList
            orders={tab === 'completed' ? completed : cancelled}
            empty={
              tab === 'completed' ? (
                <EmptyState
                  icon={<Inbox size={24} />}
                  title="Nothing served yet today"
                  body="Completed tickets move here as soon as a server marks them served."
                />
              ) : (
                <EmptyState
                  icon={<CircleSlash size={24} />}
                  title="No cancellations today"
                  body="Cancelled tickets are kept here with the reason, so the manager can review them later."
                />
              )
            }
            onOpen={setOpenId}
          />
        </div>
      )}

      <AnimatePresence>
        {openOrder ? (
          <TicketDetail
            order={openOrder}
            now={now}
            onClose={() => setOpenId(null)}
            onAdvance={(status) => {
              advance(openOrder, status)
              if (status === 'served') setOpenId(null)
            }}
            onCancel={(reason) => {
              cancelOrder(openOrder.id, reason, ON_SHIFT)
              setOpenId(null)
              toast.info(`Order ${openOrder.reference} cancelled`, reason)
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function OrderList({
  orders,
  empty,
  onOpen,
}: {
  orders: Order[]
  empty: React.ReactNode
  onOpen: (id: string) => void
}) {
  if (orders.length === 0) return <>{empty}</>
  return (
    <div>
      <div className={[s.listRow, s.listHeadRow].join(' ')}>
        <span>Order</span>
        <span>Table</span>
        <span>Items</span>
        <span>Placed</span>
        <span>Total</span>
        <span>Status</span>
      </div>
      {orders.map((order) => (
        <button
          key={order.id}
          className={s.listRow}
          onClick={() => onOpen(order.id)}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{order.reference}</span>
          <span>{order.tableLabel}</span>
          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.items.map((line) => `${line.quantity}× ${line.name}`).join(', ')}
          </span>
          <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
            {clockTime(order.placedAt)}
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{naira(order.totals.total)}</span>
          <span>
            <Badge tone={order.status === 'served' ? 'success' : 'danger'}>{order.status}</Badge>
          </span>
        </button>
      ))}
    </div>
  )
}
