import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Ban, Download, Receipt, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Select } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { naira } from '../../../lib/money'
import { lineUnitPrice } from '../../../lib/pricing'
import { clockTime, dateLabel, DAY, startOfDay } from '../../../lib/time'
import { useStore } from '../../../store/useStore'
import type { Order, OrderStatus } from '../../../types'
import { Modal } from '../Modal'
import s from '../admin.module.css'

const STATUS_TONE: Record<OrderStatus, 'accent' | 'info' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  new: 'accent',
  accepted: 'info',
  preparing: 'warning',
  ready: 'success',
  served: 'neutral',
  cancelled: 'danger',
}

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '14', label: 'Last 14 days', days: 14 },
]

export function OrdersPage() {
  const orders = useStore((state) => state.orders)
  const cancelOrder = useStore((state) => state.cancelOrder)
  const advanceOrder = useStore((state) => state.advanceOrder)
  const currentUser = useStore((state) => state.staff.find((u) => u.id === state.currentUserId))
  const toast = useToast()

  const [range, setRange] = useState('today')
  const [status, setStatus] = useState<'all' | OrderStatus>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const days = RANGES.find((r) => r.id === range)?.days ?? 1
  const from = startOfDay(Date.now()) - (days - 1) * DAY

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders
      .filter((order) => order.placedAt >= from)
      .filter((order) => (status === 'all' ? true : order.status === status))
      .filter((order) =>
        q
          ? order.reference.toLowerCase().includes(q) ||
            order.tableLabel.toLowerCase().includes(q) ||
            order.items.some((line) => line.name.toLowerCase().includes(q))
          : true,
      )
      .sort((a, b) => b.placedAt - a.placedAt)
  }, [orders, from, status, query])

  const open = orders.find((order) => order.id === openId) ?? null

  const exportCsv = () => {
    const header = ['Reference', 'Table', 'Placed', 'Status', 'Payment', 'Items', 'Total (NGN)']
    const rows = filtered.map((order) => [
      order.reference,
      order.tableLabel,
      new Date(order.placedAt).toISOString(),
      order.status,
      order.paymentStatus,
      order.items.map((line) => `${line.quantity}x ${line.name}`).join('; '),
      (order.totals.total / 100).toFixed(2),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `joan-kitchen-orders-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Orders exported', `${filtered.length} rows written to CSV.`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Orders</h1>
          <p className={s.pageSub}>
            {filtered.length} orders ·{' '}
            {naira(
              filtered.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totals.total, 0),
            )}{' '}
            in the selected period
          </p>
        </div>
        <div className={s.pageActions}>
          <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download size={15} /> Export CSV
          </Button>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.searchBox}>
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, table or dish"
            aria-label="Search orders"
          />
        </div>
        {RANGES.map((option) => (
          <button
            key={option.id}
            className={[s.chip, range === option.id ? s.chipOn : ''].join(' ')}
            onClick={() => setRange(option.id)}
          >
            {option.label}
          </button>
        ))}
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | OrderStatus)}
          style={{ width: 160, minHeight: 34 }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_TONE) as OrderStatus[]).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      <section className={s.panel}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title="No orders match those filters"
            body="Widen the date range or clear the search to see more."
          />
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Table</th>
                <th>Items</th>
                <th>Placed</th>
                <th>Payment</th>
                <th>Status</th>
                <th className={s.num}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 120).map((order) => (
                <tr key={order.id} className={s.rowButton} onClick={() => setOpenId(order.id)}>
                  <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{order.reference}</td>
                  <td>{order.tableLabel}</td>
                  <td
                    style={{
                      color: 'var(--text-secondary)',
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.items.map((line) => `${line.quantity}× ${line.name}`).join(', ')}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {clockTime(order.placedAt)}
                    <br />
                    <span style={{ fontSize: 'var(--text-2xs)' }}>{dateLabel(order.placedAt)}</span>
                  </td>
                  <td>
                    <Badge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                  </td>
                  <td className={s.num} style={{ fontWeight: 600 }}>
                    {naira(order.totals.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 120 ? (
          <p
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
            }}
          >
            Showing the 120 most recent of {filtered.length}. Narrow the filters to see the rest.
          </p>
        ) : null}
      </section>

      <AnimatePresence>
        {open ? (
          <OrderDetail
            order={open}
            onClose={() => setOpenId(null)}
            onOverride={(status) => {
              advanceOrder(open.id, status, currentUser?.name ?? 'Admin')
              toast.success(`${open.reference} set to ${status}`)
            }}
            onCancel={() => {
              cancelOrder(open.id, 'Cancelled by management', currentUser?.name ?? 'Admin')
              toast.info(`${open.reference} cancelled`)
              setOpenId(null)
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function OrderDetail({
  order,
  onClose,
  onOverride,
  onCancel,
}: {
  order: Order
  onClose: () => void
  onOverride: (status: OrderStatus) => void
  onCancel: () => void
}) {
  const settings = useStore((state) => state.settings)
  const payment = useStore((state) => state.payments.find((p) => p.id === order.paymentId))

  return (
    <Modal
      title={`Order ${order.reference}`}
      onClose={onClose}
      footer={
        order.status !== 'cancelled' && order.status !== 'served' ? (
          <>
            <Button variant="dangerQuiet" onClick={onCancel}>
              <Ban size={15} /> Cancel order
            </Button>
            <Select
              value={order.status}
              onChange={(event) => onOverride(event.target.value as OrderStatus)}
              style={{ width: 180 }}
              aria-label="Override status"
            >
              {(['new', 'accepted', 'preparing', 'ready', 'served'] as OrderStatus[]).map((status) => (
                <option key={status} value={status}>
                  Set to {status}
                </option>
              ))}
            </Select>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
        <Badge tone={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
          {order.paymentMethod === 'bank-transfer' ? 'Bank transfer' : 'Pay at table'} · {order.paymentStatus}
        </Badge>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Table {order.tableLabel} · {dateLabel(order.placedAt)} {clockTime(order.placedAt)}
        </span>
      </div>

      <table className={s.table}>
        <tbody>
          {order.items.map((line) => (
            <tr key={line.id}>
              <td style={{ width: 40, fontWeight: 700 }}>{line.quantity}×</td>
              <td>
                <span style={{ fontWeight: 600 }}>{line.name}</span>
                {line.selectedOptions.length > 0 ? (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {line.selectedOptions.map((o) => o.optionName).join(' · ')}
                  </span>
                ) : null}
                {line.notes ? (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--warning-text)' }}>
                    “{line.notes}”
                  </span>
                ) : null}
              </td>
              <td className={s.num}>{naira(lineUnitPrice(line) * line.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'grid', gap: 6, fontSize: 'var(--text-sm)' }}>
        <Row label="Subtotal" value={naira(order.totals.subtotal)} />
        <Row label={`VAT (${settings.vatRate}%)`} value={naira(order.totals.vat)} />
        <Row label={`Service charge (${settings.serviceChargeRate}%)`} value={naira(order.totals.serviceCharge)} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: 'var(--text-base)',
          }}
        >
          <span>Total</span>
          <span className="num">{naira(order.totals.total)}</span>
        </div>
      </div>

      {payment ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Payment reference {payment.reference}
          {payment.settledBy ? ` · settled by ${payment.settledBy}` : ''}
        </p>
      ) : null}

      {order.cancelReason ? (
        <p
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius)',
            background: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Cancelled — {order.cancelReason}
        </p>
      ) : null}

      <div>
        <p
          style={{
            fontSize: 'var(--text-2xs)',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}
        >
          History
        </p>
        {order.history.map((entry, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: 12,
              padding: '5px 0',
              fontSize: 'var(--text-xs)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontWeight: 600, width: 84 }}>{entry.status}</span>
            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.by}</span>
            <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {clockTime(entry.at)}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
      <span>{label}</span>
      <span className="num">{value}</span>
    </div>
  )
}
