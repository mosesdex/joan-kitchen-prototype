import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, EmptyState } from '../../../components/ui'
import { naira, nairaCompact } from '../../../lib/money'
import { DAY, relativeTime, startOfDay } from '../../../lib/time'
import { useNow } from '../../../lib/hooks'
import { useStore } from '../../../store/useStore'
import {
  activeOrders,
  dailySeries,
  itemPerformance,
  medianTicketMinutes,
  ordersBetween,
  summarise,
} from '../../../store/selectors'
import s from '../admin.module.css'

export function Dashboard() {
  const orders = useStore((state) => state.orders)
  const settings = useStore((state) => state.settings)
  const now = useNow(15000)

  const todayFrom = startOfDay(now)
  const today = useMemo(() => ordersBetween({ orders }, todayFrom, todayFrom + DAY), [orders, todayFrom])
  const yesterday = useMemo(
    () => ordersBetween({ orders }, todayFrom - DAY, todayFrom),
    [orders, todayFrom],
  )

  const summary = summarise(today)
  const previous = summarise(yesterday)
  const series = useMemo(() => dailySeries(orders, 14), [orders])
  const live = useMemo(() => activeOrders({ orders }), [orders])
  const topItems = useMemo(() => itemPerformance(today).slice(0, 5), [today])
  const median = medianTicketMinutes(today)

  const delta = (current: number, prior: number) =>
    prior === 0 ? null : Math.round(((current - prior) / prior) * 100)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Today at {settings.name}</h1>
          <p className={s.pageSub}>
            {new Date(now).toLocaleDateString('en-NG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {' · '}
            {live.length} order{live.length === 1 ? '' : 's'} on the pass right now
          </p>
        </div>
      </div>

      <div className={s.tiles}>
        <Tile
          icon={<Banknote size={13} />}
          label="Revenue today"
          value={naira(summary.revenue)}
          delta={delta(summary.revenue, previous.revenue)}
        />
        <Tile
          icon={<Receipt size={13} />}
          label="Orders"
          value={String(summary.orderCount)}
          delta={delta(summary.orderCount, previous.orderCount)}
        />
        <Tile
          icon={<TrendingUp size={13} />}
          label="Average ticket"
          value={naira(summary.averageTicket)}
          delta={delta(summary.averageTicket, previous.averageTicket)}
        />
        <Tile icon={<Users size={13} />} label="Tables served" value={String(summary.coversSeated)} />
        <Tile
          icon={<Clock3 size={13} />}
          label="Median time to ready"
          value={median ? `${median} min` : '—'}
        />
      </div>

      <div className={s.split}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Revenue, last 14 days</h2>
            <Badge tone="neutral">{nairaCompact(series.reduce((sum, p) => sum + p.revenue, 0))} total</Badge>
          </header>
          <div className={s.panelBody}>
            <div className={s.chartWrap}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => nairaCompact(value)}
                    width={58}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--border-strong)' }}
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: 'var(--text-primary)',
                    }}
                    formatter={(value) => [naira(Number(value)), 'Revenue'] as [string, string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Live orders</h2>
            <Badge tone={live.length > 0 ? 'accent' : 'neutral'}>
              <Activity size={10} /> {live.length}
            </Badge>
          </header>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {live.length === 0 ? (
              <EmptyState
                icon={<Receipt size={22} />}
                title="Nothing on the pass"
                body="New orders from the tables will appear here the moment they are placed."
              />
            ) : (
              <table className={s.table}>
                <tbody>
                  {live.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>{order.tableLabel}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {order.items.length} item{order.items.length === 1 ? '' : 's'}
                        <br />
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                          {relativeTime(order.placedAt, now)}
                        </span>
                      </td>
                      <td>
                        <Badge
                          tone={
                            order.status === 'ready'
                              ? 'success'
                              : order.status === 'new'
                                ? 'accent'
                                : 'warning'
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className={s.num}>{naira(order.totals.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <section className={s.panel} style={{ marginTop: 'var(--space-5)' }}>
        <header className={s.panelHead}>
          <h2 className={s.panelTitle}>Best sellers today</h2>
        </header>
        <div className={s.panelBody}>
          {topItems.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={22} />}
              title="No sales recorded yet today"
              body="This fills in as orders come through from the tables."
            />
          ) : (
            <div className={s.barList}>
              {topItems.map((item) => {
                const max = topItems[0].revenue || 1
                return (
                  <div className={s.barRow} key={item.itemId}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                        {' '}
                        · {item.quantity} sold
                      </span>
                      <div className={s.barTrack}>
                        <div className={s.barFill} style={{ width: `${(item.revenue / max) * 100}%` }} />
                      </div>
                    </div>
                    <span className={s.num} style={{ fontWeight: 600 }}>
                      {naira(item.revenue)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  )
}

function Tile({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta?: number | null
}) {
  return (
    <div className={s.tile}>
      <p className={s.tileLabel}>
        {icon} {label}
      </p>
      <p className={s.tileValue}>{value}</p>
      {typeof delta === 'number' ? (
        <p className={[s.tileDelta, delta >= 0 ? s.deltaUp : s.deltaDown].join(' ')}>
          {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta)}% vs yesterday
        </p>
      ) : null}
    </div>
  )
}
