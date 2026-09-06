import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, Button, EmptyState } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { naira, nairaCompact } from '../../../lib/money'
import { DAY, startOfDay } from '../../../lib/time'
import { useStore } from '../../../store/useStore'
import {
  categoryPerformance,
  dailySeries,
  hourlyHeat,
  itemPerformance,
  medianTicketMinutes,
  paymentMix,
  summarise,
} from '../../../store/selectors'
import s from '../admin.module.css'

const RANGES = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '14', label: 'Last 14 days', days: 14 },
]

const PIE_COLOURS = ['var(--amber-500)', 'var(--clay-500)', 'var(--green-500)', 'var(--blue-500)']

export function ReportsPage() {
  const orders = useStore((state) => state.orders)
  const payments = useStore((state) => state.payments)
  const menuItems = useStore((state) => state.menuItems)
  const categories = useStore((state) => state.categories)
  const toast = useToast()

  const [range, setRange] = useState('14')
  const days = RANGES.find((r) => r.id === range)?.days ?? 14
  const from = startOfDay(Date.now()) - (days - 1) * DAY

  const windowOrders = useMemo(() => orders.filter((o) => o.placedAt >= from), [orders, from])
  const priorOrders = useMemo(
    () => orders.filter((o) => o.placedAt >= from - days * DAY && o.placedAt < from),
    [orders, from, days],
  )

  const summary = summarise(windowOrders)
  const prior = summarise(priorOrders)
  const series = useMemo(() => dailySeries(orders, days), [orders, days])
  const byCategory = useMemo(
    () => categoryPerformance(windowOrders, menuItems, categories),
    [windowOrders, menuItems, categories],
  )
  const items = useMemo(() => itemPerformance(windowOrders), [windowOrders])
  const heat = useMemo(() => hourlyHeat(windowOrders), [windowOrders])
  const mix = useMemo(() => paymentMix(windowOrders, payments), [windowOrders, payments])
  const median = medianTicketMinutes(windowOrders)

  const peakHour = heat.reduce((best, bucket) => (bucket.orders > best.orders ? bucket : best), heat[0])
  const heatMax = Math.max(...heat.map((h) => h.orders), 1)

  const delta = prior.revenue === 0 ? null : Math.round(((summary.revenue - prior.revenue) / prior.revenue) * 100)

  const exportReport = () => {
    const header = ['Date', 'Orders', 'Revenue (NGN)']
    const rows = series.map((point) => [point.date, point.orders, (point.revenue / 100).toFixed(2)])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `joan-kitchen-sales-${days}d.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported', `${series.length} days written to CSV.`)
  }

  if (windowOrders.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={22} />}
        title="No sales in this period"
        body="Reports fill in as orders come through. Place one from the customer iPad to see it appear here."
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Reports</h1>
          <p className={s.pageSub}>Sales, menu performance and service timing</p>
        </div>
        <div className={s.pageActions}>
          {RANGES.map((option) => (
            <button
              key={option.id}
              className={[s.chip, range === option.id ? s.chipOn : ''].join(' ')}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </button>
          ))}
          <Button variant="secondary" onClick={exportReport}>
            <Download size={15} /> Export
          </Button>
        </div>
      </div>

      <div className={s.tiles}>
        <div className={s.tile}>
          <p className={s.tileLabel}>Revenue</p>
          <p className={s.tileValue}>{naira(summary.revenue)}</p>
          {delta !== null ? (
            <p className={[s.tileDelta, delta >= 0 ? s.deltaUp : s.deltaDown].join(' ')}>
              {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(delta)}% vs previous {days} days
            </p>
          ) : null}
        </div>
        <div className={s.tile}>
          <p className={s.tileLabel}>Orders</p>
          <p className={s.tileValue}>{summary.orderCount}</p>
          <p style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {summary.cancelledCount} cancelled
          </p>
        </div>
        <div className={s.tile}>
          <p className={s.tileLabel}>Average ticket</p>
          <p className={s.tileValue}>{naira(summary.averageTicket)}</p>
        </div>
        <div className={s.tile}>
          <p className={s.tileLabel}>Median time to ready</p>
          <p className={s.tileValue}>{median} min</p>
        </div>
        <div className={s.tile}>
          <p className={s.tileLabel}>Busiest hour</p>
          <p className={s.tileValue}>
            {peakHour.hour.toString().padStart(2, '0')}:00
          </p>
          <p style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {peakHour.orders} orders
          </p>
        </div>
      </div>

      <section className={s.panel} style={{ marginBottom: 'var(--space-5)' }}>
        <header className={s.panelHead}>
          <h2 className={s.panelTitle}>Revenue and orders by day</h2>
        </header>
        <div className={s.panelBody}>
          <div className={s.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => nairaCompact(value)}
                  width={58}
                />
                <Tooltip
                  cursor={{ fill: 'var(--surface-3)' }}
                  contentStyle={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) =>
                    (name === 'revenue'
                      ? [naira(Number(value)), 'Revenue']
                      : [String(value), 'Orders']) as [string, string]
                  }
                />
                <Bar dataKey="revenue" fill="var(--amber-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className={s.split} style={{ marginBottom: 'var(--space-5)' }}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Revenue by category</h2>
          </header>
          <div className={s.panelBody}>
            <div className={s.barList}>
              {byCategory.map((category) => {
                const max = byCategory[0].revenue || 1
                return (
                  <div className={s.barRow} key={category.name}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{category.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        {' '}
                        · {category.quantity} sold
                      </span>
                      <div className={s.barTrack}>
                        <div className={s.barFill} style={{ width: `${(category.revenue / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className={s.num} style={{ fontWeight: 600 }}>
                      {naira(category.revenue)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>How guests paid</h2>
          </header>
          <div className={s.panelBody}>
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mix}
                    dataKey="amount"
                    nameKey="label"
                    innerRadius={54}
                    outerRadius={84}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {mix.map((entry, index) => (
                      <Cell key={entry.method} fill={PIE_COLOURS[index % PIE_COLOURS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => naira(Number(value))}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {mix.map((entry) => (
              <div
                key={entry.method}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-sm)',
                  padding: '5px 0',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span>{entry.label}</span>
                <span className="num" style={{ color: 'var(--text-secondary)' }}>
                  {entry.count} orders · {naira(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={s.panel} style={{ marginBottom: 'var(--space-5)' }}>
        <header className={s.panelHead}>
          <h2 className={s.panelTitle}>When orders come in</h2>
          <Badge tone="neutral">peak {peakHour.hour}:00</Badge>
        </header>
        <div className={s.panelBody}>
          <div className={s.heat}>
            {heat.map((bucket) => (
              <div
                key={bucket.hour}
                className={s.heatCell}
                title={`${bucket.hour}:00 — ${bucket.orders} orders`}
                style={{
                  background:
                    bucket.orders === 0
                      ? 'var(--surface-3)'
                      : `color-mix(in srgb, var(--amber-500) ${Math.round(
                          (bucket.orders / heatMax) * 100,
                        )}%, var(--surface-3))`,
                }}
              />
            ))}
          </div>
          <div className={s.heatScale}>
            <span>00:00</span>
            <span style={{ marginLeft: 'auto' }}>23:00</span>
          </div>
        </div>
      </section>

      <div className={s.split}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Top 10 dishes</h2>
          </header>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Dish</th>
                <th className={s.num}>Sold</th>
                <th className={s.num}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((item) => (
                <tr key={item.itemId}>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td className={s.num}>{item.quantity}</td>
                  <td className={s.num} style={{ fontWeight: 600 }}>
                    {naira(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Slowest movers</h2>
          </header>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Dish</th>
                <th className={s.num}>Sold</th>
                <th className={s.num}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {items
                .slice(-6)
                .reverse()
                .map((item) => (
                  <tr key={item.itemId}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td className={s.num}>{item.quantity}</td>
                    <td className={s.num}>{naira(item.revenue)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border)',
            }}
          >
            Dishes with no sales at all in this period do not appear — check the menu for items that
            have been unavailable.
          </p>
        </section>
      </div>
    </motion.div>
  )
}
