import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, QrCode, Table2, Trash2 } from 'lucide-react'
import { Badge, Button, EmptyState, Field, Select, TextInput } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { makeId, makePairingCode } from '../../../lib/id'
import { useStore } from '../../../store/useStore'
import type { RestaurantTable, TableStatus } from '../../../types'
import { ConfirmModal, Modal } from '../Modal'
import s from '../admin.module.css'

const STATUS_TONE: Record<TableStatus, 'success' | 'accent' | 'warning' | 'info'> = {
  free: 'success',
  occupied: 'accent',
  'needs-cleaning': 'warning',
  reserved: 'info',
}

const STATUS_LABEL: Record<TableStatus, string> = {
  free: 'Free',
  occupied: 'Occupied',
  'needs-cleaning': 'Needs cleaning',
  reserved: 'Reserved',
}

export function TablesPage() {
  const tables = useStore((state) => state.tables)
  const orders = useStore((state) => state.orders)
  const upsertTable = useStore((state) => state.upsertTable)
  const deleteTable = useStore((state) => state.deleteTable)
  const setTableStatus = useStore((state) => state.setTableStatus)
  const toast = useToast()

  const [zone, setZone] = useState<string>('all')
  const [editing, setEditing] = useState<RestaurantTable | null>(null)
  const [deleting, setDeleting] = useState<RestaurantTable | null>(null)

  const zones = useMemo(() => [...new Set(tables.map((t) => t.zone))], [tables])
  const visible = zone === 'all' ? tables : tables.filter((t) => t.zone === zone)

  const activeByTable = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders) {
      if (['new', 'accepted', 'preparing', 'ready'].includes(order.status)) {
        map.set(order.tableId, (map.get(order.tableId) ?? 0) + 1)
      }
    }
    return map
  }, [orders])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Tables</h1>
          <p className={s.pageSub}>
            {tables.length} tables · {tables.filter((t) => t.status === 'occupied').length} occupied ·{' '}
            {tables.reduce((sum, t) => sum + t.seats, 0)} covers
          </p>
        </div>
        <div className={s.pageActions}>
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                id: makeId('tbl'),
                label: '',
                zone: zones[0] ?? 'Main hall',
                seats: 4,
                status: 'free',
                pairingCode: makePairingCode(),
              })
            }
          >
            <Plus size={15} /> Add table
          </Button>
        </div>
      </div>

      <div className={s.toolbar}>
        <button
          className={[s.chip, zone === 'all' ? s.chipOn : ''].join(' ')}
          onClick={() => setZone('all')}
        >
          All zones
        </button>
        {zones.map((z) => (
          <button
            key={z}
            className={[s.chip, zone === z ? s.chipOn : ''].join(' ')}
            onClick={() => setZone(z)}
          >
            {z}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Table2 size={22} />}
          title="No tables in this zone"
          body="Add a table and it becomes selectable on the customer iPads immediately."
        />
      ) : (
        <div className={s.tableBoard}>
          {visible.map((table) => {
            const live = activeByTable.get(table.id) ?? 0
            return (
              <div className={s.tableCard} key={table.id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p className={s.tableCardLabel}>{table.label}</p>
                    <p className={s.tableCardMeta}>
                      {table.zone} · {table.seats} seats
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[table.status]}>{STATUS_LABEL[table.status]}</Badge>
                </div>

                {live > 0 ? (
                  <p style={{ marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--accent-text)', fontWeight: 600 }}>
                    {live} live order{live === 1 ? '' : 's'}
                  </p>
                ) : null}

                <p className={s.tableCardCode}>
                  <QrCode size={11} style={{ verticalAlign: -1, marginRight: 5 }} />
                  {table.pairingCode}
                </p>

                <div style={{ display: 'flex', gap: 4, marginTop: 'var(--space-3)' }}>
                  <Select
                    value={table.status}
                    onChange={(event) => {
                      setTableStatus(table.id, event.target.value as TableStatus)
                      toast.success(`${table.label} marked ${STATUS_LABEL[event.target.value as TableStatus].toLowerCase()}`)
                    }}
                    aria-label={`Status of ${table.label}`}
                    style={{ minHeight: 34, fontSize: 'var(--text-xs)' }}
                  >
                    {(Object.keys(STATUS_LABEL) as TableStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => setEditing(table)}
                    aria-label={`Edit ${table.label}`}
                  >
                    <Table2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    onClick={() => setDeleting(table)}
                    aria-label={`Delete ${table.label}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {editing ? (
          <TableEditor
            table={editing}
            zones={zones}
            onClose={() => setEditing(null)}
            onSave={(next) => {
              upsertTable(next)
              setEditing(null)
              toast.success(`Table ${next.label} saved`)
            }}
          />
        ) : null}
        {deleting ? (
          <ConfirmModal
            title={`Delete table ${deleting.label}?`}
            body="Guests will no longer be able to select it on the iPads. Past orders keep their record of the table."
            onClose={() => setDeleting(null)}
            onConfirm={() => {
              deleteTable(deleting.id)
              toast.info(`Table ${deleting.label} deleted`)
              setDeleting(null)
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function TableEditor({
  table,
  zones,
  onClose,
  onSave,
}: {
  table: RestaurantTable
  zones: string[]
  onClose: () => void
  onSave: (table: RestaurantTable) => void
}) {
  const [draft, setDraft] = useState(table)
  const invalid = draft.label.trim().length === 0

  return (
    <Modal
      title={table.label ? `Edit table ${table.label}` : 'New table'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={invalid} onClick={() => onSave(draft)}>
            Save table
          </Button>
        </>
      }
    >
      <div className={s.formGrid}>
        <Field label="Label" error={invalid ? 'Give the table a label' : undefined} htmlFor="tbl-label">
          <TextInput
            id="tbl-label"
            value={draft.label}
            invalid={invalid}
            onChange={(event) => setDraft({ ...draft, label: event.target.value.toUpperCase() })}
            placeholder="T12"
          />
        </Field>
        <Field label="Seats" htmlFor="tbl-seats">
          <TextInput
            id="tbl-seats"
            type="number"
            min={1}
            max={20}
            value={draft.seats}
            onChange={(event) => setDraft({ ...draft, seats: Number(event.target.value) })}
          />
        </Field>
        <Field label="Zone" htmlFor="tbl-zone">
          <TextInput
            id="tbl-zone"
            list="zone-options"
            value={draft.zone}
            onChange={(event) => setDraft({ ...draft, zone: event.target.value })}
          />
        </Field>
        <datalist id="zone-options">
          {zones.map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
        <Field
          label="Pairing code"
          hint="Guests type this to claim the table on a shared iPad."
          htmlFor="tbl-code"
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <TextInput
              id="tbl-code"
              value={draft.pairingCode}
              onChange={(event) => setDraft({ ...draft, pairingCode: event.target.value.toUpperCase() })}
              maxLength={6}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDraft({ ...draft, pairingCode: makePairingCode() })}
            >
              New
            </Button>
          </div>
        </Field>
      </div>
    </Modal>
  )
}
