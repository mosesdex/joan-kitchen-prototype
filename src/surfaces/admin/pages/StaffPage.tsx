import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { Badge, Button, Field, Select, TextInput, Toggle } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { ROLE_PERMISSIONS } from '../../../data/restaurant'
import { makeId } from '../../../lib/id'
import { relativeTime } from '../../../lib/time'
import { useNow } from '../../../lib/hooks'
import { useStore } from '../../../store/useStore'
import type { Permission, StaffRole, StaffUser } from '../../../types'
import { ConfirmModal, Modal } from '../Modal'
import s from '../admin.module.css'

const ROLES: StaffRole[] = ['owner', 'manager', 'kitchen', 'waiter']

const PERMISSIONS: { id: Permission; label: string }[] = [
  { id: 'menu.manage', label: 'Manage menu' },
  { id: 'tables.manage', label: 'Manage tables' },
  { id: 'orders.view', label: 'View orders' },
  { id: 'orders.manage', label: 'Change order status' },
  { id: 'payments.view', label: 'View payments' },
  { id: 'staff.manage', label: 'Manage staff' },
  { id: 'reports.view', label: 'View reports' },
  { id: 'settings.manage', label: 'Change settings' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

export function StaffPage() {
  const staff = useStore((state) => state.staff)
  const currentUserId = useStore((state) => state.currentUserId)
  const upsertStaff = useStore((state) => state.upsertStaff)
  const deleteStaff = useStore((state) => state.deleteStaff)
  const toast = useToast()
  const now = useNow(30000)

  const [editing, setEditing] = useState<StaffUser | null>(null)
  const [deleting, setDeleting] = useState<StaffUser | null>(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Staff</h1>
          <p className={s.pageSub}>
            {staff.filter((user) => user.active).length} active ·{' '}
            {staff.filter((user) => !user.active).length} deactivated
          </p>
        </div>
        <div className={s.pageActions}>
          <Button
            variant="primary"
            onClick={() =>
              setEditing({
                id: makeId('stf'),
                name: '',
                email: '',
                role: 'waiter',
                active: true,
                lastActiveAt: Date.now(),
                pin: String(Math.floor(1000 + Math.random() * 9000)),
              })
            }
          >
            <UserPlus size={15} /> Invite someone
          </Button>
        </div>
      </div>

      <div className={s.split}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>People</h2>
          </header>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Last active</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {staff.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className={s.avatar}>{initials(user.name)}</span>
                      <span>
                        <span style={{ fontWeight: 600, display: 'block' }}>{user.name}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                          {user.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    {relativeTime(user.lastActiveAt, now)}
                  </td>
                  <td>
                    <Badge tone={user.active ? 'success' : 'neutral'}>
                      {user.active ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td>
                    <div className={s.rowActions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => setEditing(user)}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled={user.id === currentUserId}
                        onClick={() => setDeleting(user)}
                        aria-label={`Remove ${user.name}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>What each role can do</h2>
          </header>
          <div className={s.panelBody}>
            <table className={s.permMatrix}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Permission</th>
                  {ROLES.map((role) => (
                    <th key={role} style={{ textTransform: 'capitalize' }}>
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((permission) => (
                  <tr key={permission.id}>
                    <td>{permission.label}</td>
                    {ROLES.map((role) => (
                      <td key={role}>
                        {ROLE_PERMISSIONS[role].includes(permission.id) ? (
                          <Check size={15} color="var(--success)" />
                        ) : (
                          <X size={15} color="var(--text-muted)" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Roles are fixed in the prototype. Production adds custom roles so an owner can, for
              example, let a supervisor void orders without giving them the reports.
            </p>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {editing ? (
          <StaffEditor
            user={editing}
            onClose={() => setEditing(null)}
            onSave={(next) => {
              upsertStaff(next)
              setEditing(null)
              toast.success(`${next.name} saved`)
            }}
          />
        ) : null}
        {deleting ? (
          <ConfirmModal
            title={`Remove ${deleting.name}?`}
            body="They lose access immediately. Orders they handled keep their name in the history."
            confirmLabel="Remove"
            onClose={() => setDeleting(null)}
            onConfirm={() => {
              deleteStaff(deleting.id)
              toast.info(`${deleting.name} removed`)
              setDeleting(null)
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function StaffEditor({
  user,
  onClose,
  onSave,
}: {
  user: StaffUser
  onClose: () => void
  onSave: (user: StaffUser) => void
}) {
  const [draft, setDraft] = useState(user)
  const nameInvalid = draft.name.trim().length === 0
  const emailInvalid = !/^\S+@\S+\.\S+$/.test(draft.email.trim())
  const pinInvalid = !/^\d{4}$/.test(draft.pin)

  return (
    <Modal
      title={user.name ? `Edit ${user.name}` : 'Invite someone'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={nameInvalid || emailInvalid || pinInvalid}
            onClick={() => onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() })}
          >
            <Plus size={15} /> Save
          </Button>
        </>
      }
    >
      <div className={s.formGrid}>
        <Field label="Full name" error={nameInvalid ? 'Enter their name' : undefined} htmlFor="staff-name">
          <TextInput
            id="staff-name"
            value={draft.name}
            invalid={nameInvalid}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Chidi Okonkwo"
          />
        </Field>
        <Field
          label="Email"
          error={emailInvalid ? 'Enter a valid email address' : undefined}
          htmlFor="staff-email"
        >
          <TextInput
            id="staff-email"
            type="email"
            value={draft.email}
            invalid={emailInvalid}
            onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            placeholder="name@joankitchen.ng"
          />
        </Field>
        <Field label="Role" htmlFor="staff-role">
          <Select
            id="staff-role"
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value as StaffRole })}
          >
            {ROLES.map((role) => (
              <option key={role} value={role} style={{ textTransform: 'capitalize' }}>
                {role}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="PIN"
          error={pinInvalid ? 'Four digits' : undefined}
          hint="Prototype only — production sends a set-password link."
          htmlFor="staff-pin"
        >
          <TextInput
            id="staff-pin"
            inputMode="numeric"
            maxLength={4}
            value={draft.pin}
            invalid={pinInvalid}
            onChange={(event) => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, '') })}
          />
        </Field>
        <div className={s.formGridFull}>
          <Toggle
            checked={draft.active}
            onChange={(active) => setDraft({ ...draft, active })}
            label="Account active"
            description="Deactivated staff keep their history but cannot sign in."
          />
        </div>
      </div>
    </Modal>
  )
}
