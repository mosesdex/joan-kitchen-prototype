import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Clock, Landmark, Percent, RotateCcw, Save, Volume2 } from 'lucide-react'
import { Button, Field, TextArea, TextInput, Toggle } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { useStore } from '../../../store/useStore'
import s from '../admin.module.css'

export function SettingsPage() {
  const settings = useStore((state) => state.settings)
  const updateSettings = useStore((state) => state.updateSettings)
  const toast = useToast()

  const [draft, setDraft] = useState(settings)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings)

  const vatInvalid = draft.vatRate < 0 || draft.vatRate > 100
  const serviceInvalid = draft.serviceChargeRate < 0 || draft.serviceChargeRate > 100
  const accountInvalid = !/^\d{10}$/.test(draft.bankAccountNumber)
  const blocked = vatInvalid || serviceInvalid || accountInvalid

  const patch = (next: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...next }))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Settings</h1>
          <p className={s.pageSub}>
            Changes here reach every iPad and the kitchen display as soon as you save.
          </p>
        </div>
        <div className={s.pageActions}>
          <Button variant="secondary" disabled={!dirty} onClick={() => setDraft(settings)}>
            <RotateCcw size={15} /> Discard changes
          </Button>
          <Button
            variant="primary"
            disabled={!dirty || blocked}
            onClick={() => {
              updateSettings(draft)
              toast.success('Settings saved', 'Every surface has been updated.')
            }}
          >
            <Save size={15} /> Save changes
          </Button>
        </div>
      </div>

      <div className={s.settingsGrid}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <Building2 size={16} />
            <h2 className={s.panelTitle}>Restaurant</h2>
          </header>
          <div className={s.panelBody}>
            <div className={s.formGrid}>
              <Field label="Name" htmlFor="set-name">
                <TextInput
                  id="set-name"
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>
              <Field label="Tagline" htmlFor="set-tag">
                <TextInput
                  id="set-tag"
                  value={draft.tagline}
                  onChange={(event) => patch({ tagline: event.target.value })}
                />
              </Field>
              <div className={s.formGridFull}>
                <Field label="Address" htmlFor="set-address">
                  <TextArea
                    id="set-address"
                    value={draft.address}
                    style={{ minHeight: 60 }}
                    onChange={(event) => patch({ address: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Phone" htmlFor="set-phone">
                <TextInput
                  id="set-phone"
                  value={draft.phone}
                  onChange={(event) => patch({ phone: event.target.value })}
                />
              </Field>
              <Field label="Currency" hint="Prototype is fixed to naira." htmlFor="set-currency">
                <TextInput id="set-currency" value={draft.currency} disabled />
              </Field>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <Percent size={16} />
            <h2 className={s.panelTitle}>Charges</h2>
          </header>
          <div className={s.panelBody}>
            <div className={s.formGrid}>
              <Field
                label="VAT rate (%)"
                error={vatInvalid ? 'Must be between 0 and 100' : undefined}
                hint="Nigerian VAT is 7.5%."
                htmlFor="set-vat"
              >
                <TextInput
                  id="set-vat"
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={draft.vatRate}
                  invalid={vatInvalid}
                  onChange={(event) => patch({ vatRate: Number(event.target.value) })}
                />
              </Field>
              <Field
                label="Service charge (%)"
                error={serviceInvalid ? 'Must be between 0 and 100' : undefined}
                hint="Applied to the subtotal, not to the VAT."
                htmlFor="set-service"
              >
                <TextInput
                  id="set-service"
                  type="number"
                  step={0.5}
                  min={0}
                  max={100}
                  value={draft.serviceChargeRate}
                  invalid={serviceInvalid}
                  onChange={(event) => patch({ serviceChargeRate: Number(event.target.value) })}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <Landmark size={16} />
            <h2 className={s.panelTitle}>Bank transfer details</h2>
          </header>
          <div className={s.panelBody}>
            <div className={s.formGrid}>
              <Field label="Bank" htmlFor="set-bank">
                <TextInput
                  id="set-bank"
                  value={draft.bankName}
                  onChange={(event) => patch({ bankName: event.target.value })}
                />
              </Field>
              <Field label="Account name" htmlFor="set-acct-name">
                <TextInput
                  id="set-acct-name"
                  value={draft.bankAccountName}
                  onChange={(event) => patch({ bankAccountName: event.target.value })}
                />
              </Field>
              <Field
                label="Account number"
                error={accountInvalid ? 'Nigerian account numbers are 10 digits' : undefined}
                htmlFor="set-acct"
              >
                <TextInput
                  id="set-acct"
                  inputMode="numeric"
                  maxLength={10}
                  value={draft.bankAccountNumber}
                  invalid={accountInvalid}
                  onChange={(event) =>
                    patch({ bankAccountNumber: event.target.value.replace(/\D/g, '') })
                  }
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <Volume2 size={16} />
            <h2 className={s.panelTitle}>Kitchen display</h2>
          </header>
          <div className={s.panelBody} style={{ display: 'grid', gap: 'var(--space-4)' }}>
            <Toggle
              checked={draft.kitchenSoundEnabled}
              onChange={(kitchenSoundEnabled) => patch({ kitchenSoundEnabled })}
              label="Chime on a new ticket"
              description="Kitchen staff can still mute it from their own screen."
            />
            <div className={s.formGrid}>
              <Field
                label="Amber after (minutes)"
                hint="Ticket turns amber once it has been waiting this long."
                htmlFor="set-warn"
              >
                <TextInput
                  id="set-warn"
                  type="number"
                  min={1}
                  max={60}
                  value={draft.ticketWarningMinutes}
                  onChange={(event) => patch({ ticketWarningMinutes: Number(event.target.value) })}
                />
              </Field>
              <Field label="Red after (minutes)" htmlFor="set-danger">
                <TextInput
                  id="set-danger"
                  type="number"
                  min={1}
                  max={90}
                  value={draft.ticketDangerMinutes}
                  onChange={(event) => patch({ ticketDangerMinutes: Number(event.target.value) })}
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <Clock size={16} />
            <h2 className={s.panelTitle}>Opening hours</h2>
          </header>
          <div className={s.panelBody}>
            {draft.openingHours.map((day, index) => (
              <div className={s.hoursRow} key={day.day}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{day.day}</span>
                <TextInput
                  type="time"
                  value={day.open}
                  disabled={day.closed}
                  aria-label={`${day.day} opening time`}
                  onChange={(event) => {
                    const hours = [...draft.openingHours]
                    hours[index] = { ...day, open: event.target.value }
                    patch({ openingHours: hours })
                  }}
                />
                <TextInput
                  type="time"
                  value={day.close}
                  disabled={day.closed}
                  aria-label={`${day.day} closing time`}
                  onChange={(event) => {
                    const hours = [...draft.openingHours]
                    hours[index] = { ...day, close: event.target.value }
                    patch({ openingHours: hours })
                  }}
                />
                <Toggle
                  checked={!day.closed}
                  onChange={(open) => {
                    const hours = [...draft.openingHours]
                    hours[index] = { ...day, closed: !open }
                    patch({ openingHours: hours })
                  }}
                  ariaLabel={`${day.day} open`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  )
}
