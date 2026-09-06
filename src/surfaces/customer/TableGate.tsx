import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, Utensils } from 'lucide-react'
import { Button } from '../../components/ui'
import { dishImage } from '../../data/images'
import { useStore } from '../../store/useStore'
import s from './customer.module.css'

/**
 * The idle screen an iPad shows between guests. Confirming a table binds this
 * device to it for the sitting; occupied tables are still selectable because a
 * second guest at the same table is the normal case.
 */
export function TableGate({ onConfirm }: { onConfirm: () => void }) {
  const tables = useStore((state) => state.tables)
  const settings = useStore((state) => state.settings)
  const setActiveTable = useStore((state) => state.setActiveTable)

  const zones = useMemo(() => [...new Set(tables.map((t) => t.zone))], [tables])
  const [zone, setZone] = useState(zones[0] ?? '')
  const [selected, setSelected] = useState<string | null>(null)

  const visible = tables.filter((t) => t.zone === zone)
  const chosen = tables.find((t) => t.id === selected)

  return (
    <div className={s.gate}>
      <div className={s.gateArt}>
        <img src={dishImage('hero', 1400)} alt="" />
        <div className={s.gateArtVeil} />
        <motion.div
          className={s.gateArtCopy}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={s.gateEyebrow}>
            <Utensils size={11} /> Order from your table
          </span>
          <h1 className={s.gateTitle}>{settings.name}</h1>
          <p className={s.gateSub}>{settings.tagline}. Everything is cooked to order, so tell us how you like it.</p>
        </motion.div>
      </div>

      <div className={s.gatePanel}>
        <div className={s.gateHead}>
          <h2>Which table are you on?</h2>
          <p>It is printed on the stand in front of you. Your order goes straight to the kitchen with this number.</p>
        </div>

        <div className={s.zoneTabs} role="tablist" aria-label="Dining zones">
          {zones.map((z) => (
            <button
              key={z}
              role="tab"
              aria-selected={z === zone}
              className={[s.zoneTab, z === zone ? s.zoneTabActive : ''].join(' ')}
              onClick={() => {
                setZone(z)
                setSelected(null)
              }}
            >
              {z}
            </button>
          ))}
        </div>

        <div className={s.tableGrid}>
          {visible.map((table) => (
            <button
              key={table.id}
              className={[s.tableChip, table.id === selected ? s.tableChipActive : ''].join(' ')}
              onClick={() => setSelected(table.id)}
              disabled={table.status === 'needs-cleaning'}
              aria-pressed={table.id === selected}
              aria-label={`Table ${table.label}, ${table.seats} seats${
                table.status === 'needs-cleaning' ? ', being cleared' : ''
              }`}
            >
              <span className={s.tableLabel}>{table.label}</span>
              <span className={s.tableSeats}>
                {table.status === 'needs-cleaning' ? 'being cleared' : `${table.seats} seats`}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          block
          disabled={!chosen}
          onClick={() => {
            if (!chosen) return
            setActiveTable(chosen.id)
            onConfirm()
          }}
        >
          {chosen ? `Start ordering on ${chosen.label}` : 'Choose a table to continue'}
          <ArrowRight size={17} />
        </Button>

        <p
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 'var(--space-4)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
          }}
        >
          <MapPin size={12} /> {settings.address}
        </p>
      </div>
    </div>
  )
}
