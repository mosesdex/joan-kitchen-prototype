import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, CheckCircle2, CreditCard, HandCoins, Search, Wallet } from 'lucide-react'
import { Badge, Button, EmptyState } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { naira } from '../../../lib/money'
import { clockTime, dateLabel, DAY, startOfDay } from '../../../lib/time'
import { useStore } from '../../../store/useStore'
import s from '../admin.module.css'

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '14', label: 'Last 14 days', days: 14 },
]

export function PaymentsPage() {
  const payments = useStore((state) => state.payments)
  const orders = useStore((state) => state.orders)
  const setPaymentStatus = useStore((state) => state.setPaymentStatus)
  const currentUser = useStore((state) => state.staff.find((u) => u.id === state.currentUserId))
  const toast = useToast()

  const [range, setRange] = useState('today')
  const [query, setQuery] = useState('')
  const [onlyOutstanding, setOnlyOutstanding] = useState(false)

  const days = RANGES.find((r) => r.id === range)?.days ?? 1
  const from = startOfDay(Date.now()) - (days - 1) * DAY

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments
      .filter((payment) => payment.createdAt >= from)
      .map((payment) => ({ payment, order: orders.find((o) => o.id === payment.orderId) }))
      .filter(({ order }) => Boolean(order))
      .filter(({ payment }) => (onlyOutstanding ? payment.status !== 'paid' : true))
      .filter(({ payment, order }) =>
        q
          ? payment.reference.toLowerCase().includes(q) ||
            (order?.reference.toLowerCase().includes(q) ?? false) ||
            (order?.tableLabel.toLowerCase().includes(q) ?? false)
          : true,
      )
      .sort((a, b) => b.payment.createdAt - a.payment.createdAt)
  }, [payments, orders, from, query, onlyOutstanding])

  const settled = rows.filter(({ payment }) => payment.status === 'paid')
  const outstanding = rows.filter(({ payment }) => payment.status !== 'paid')
  const byTransfer = settled.filter(({ payment }) => payment.method === 'bank-transfer')
  const byTable = settled.filter(({ payment }) => payment.method === 'pay-at-table')

  const sum = (list: typeof rows) => list.reduce((total, { payment }) => total + payment.amount, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Payments</h1>
          <p className={s.pageSub}>Transactions and outstanding bills for the selected period</p>
        </div>
      </div>

      <div className={s.tiles}>
        <Tile icon={<Wallet size={13} />} label="Settled" value={naira(sum(settled))} note={`${settled.length} payments`} />
        <Tile
          icon={<Banknote size={13} />}
          label="By bank transfer"
          value={naira(sum(byTransfer))}
          note={`${byTransfer.length} payments`}
        />
        <Tile
          icon={<HandCoins size={13} />}
          label="Settled at the table"
          value={naira(sum(byTable))}
          note={`${byTable.length} payments`}
        />
        <Tile
          icon={<CreditCard size={13} />}
          label="Outstanding"
          value={naira(sum(outstanding))}
          note={`${outstanding.length} unpaid bills`}
        />
      </div>

      <div className={s.toolbar}>
        <div className={s.searchBox}>
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference or table"
            aria-label="Search payments"
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
        <button
          className={[s.chip, onlyOutstanding ? s.chipOn : ''].join(' ')}
          onClick={() => setOnlyOutstanding((value) => !value)}
        >
          Outstanding only
        </button>
      </div>

      <section className={s.panel}>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Wallet size={22} />}
            title="No transactions in this period"
            body="Payments appear here the moment a guest transfers or a server settles a bill at the table."
          />
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Order</th>
                <th>Table</th>
                <th>Method</th>
                <th>Created</th>
                <th>Status</th>
                <th className={s.num}>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 120).map(({ payment, order }) => (
                <tr key={payment.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {payment.reference}
                  </td>
                  <td style={{ fontWeight: 600 }}>{order?.reference}</td>
                  <td>{order?.tableLabel}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {payment.method === 'bank-transfer' ? 'Bank transfer' : 'Pay at table'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {clockTime(payment.createdAt)}
                    <br />
                    <span style={{ fontSize: 'var(--text-2xs)' }}>{dateLabel(payment.createdAt)}</span>
                  </td>
                  <td>
                    <Badge
                      tone={
                        payment.status === 'paid'
                          ? 'success'
                          : payment.status === 'refunded'
                            ? 'neutral'
                            : 'warning'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td className={s.num} style={{ fontWeight: 600 }}>
                    {naira(payment.amount)}
                  </td>
                  <td>
                    {payment.status !== 'paid' && order?.status !== 'cancelled' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPaymentStatus(payment.id, 'paid', currentUser?.name)
                          toast.success(
                            `${order?.reference} marked paid`,
                            `${naira(payment.amount)} settled by ${currentUser?.name ?? 'staff'}.`,
                          )
                        }}
                      >
                        <CheckCircle2 size={13} /> Mark paid
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </motion.div>
  )
}

function Tile({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  label: string
  value: string
  note: string
}) {
  return (
    <div className={s.tile}>
      <p className={s.tileLabel}>
        {icon} {label}
      </p>
      <p className={s.tileValue}>{value}</p>
      <p style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{note}</p>
    </div>
  )
}
