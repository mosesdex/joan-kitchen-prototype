import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock, Flame, Leaf, ShoppingBag, Sparkles, X } from 'lucide-react'
import { DishImage } from '../../components/DishImage'
import { Badge, Button, Field, QuantityStepper, SpiceMeter, TextArea } from '../../components/ui'
import { useEscape, useScrollLock } from '../../lib/hooks'
import { makeId } from '../../lib/id'
import { naira } from '../../lib/money'
import { lineUnitPrice } from '../../lib/pricing'
import type { MenuItem, OrderItem, SelectedOption } from '../../types'
import s from './sheets.module.css'

const DIETARY_LABEL: Record<string, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'contains-nuts': 'Contains nuts',
  'contains-gluten': 'Contains gluten',
  'contains-dairy': 'Contains dairy',
  'contains-shellfish': 'Contains shellfish',
  halal: 'Halal',
}

/**
 * Dish detail and customisation. Required single-choice groups default to their
 * first available option, so the add button is never blocked by a hidden
 * requirement further down the sheet.
 */
export function ItemSheet({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem
  onClose: () => void
  onAdd: (line: OrderItem) => void
}) {
  useScrollLock(true)
  useEscape(onClose)

  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    for (const group of item.optionGroups) {
      const first = group.options.find((o) => o.available)
      initial[group.id] = group.type === 'single' && group.required && first ? [first.id] : []
    }
    return initial
  })
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const selectedOptions = useMemo<SelectedOption[]>(() => {
    const result: SelectedOption[] = []
    for (const group of item.optionGroups) {
      for (const optionId of selections[group.id] ?? []) {
        const option = group.options.find((o) => o.id === optionId)
        if (!option) continue
        result.push({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceDelta: option.priceDelta,
        })
      }
    }
    return result
  }, [item.optionGroups, selections])

  const unitPrice = lineUnitPrice({ unitPrice: item.price, selectedOptions })
  const total = unitPrice * quantity

  const missingRequired = item.optionGroups.filter(
    (group) => group.required && (selections[group.id]?.length ?? 0) === 0,
  )

  const toggle = (groupId: string, optionId: string, type: 'single' | 'multi', max?: number) =>
    setSelections((current) => {
      const existing = current[groupId] ?? []
      if (type === 'single') return { ...current, [groupId]: [optionId] }
      if (existing.includes(optionId)) {
        return { ...current, [groupId]: existing.filter((id) => id !== optionId) }
      }
      if (max && existing.length >= max) return current
      return { ...current, [groupId]: [...existing, optionId] }
    })

  const add = () => {
    onAdd({
      id: makeId('line'),
      menuItemId: item.id,
      name: item.name,
      unitPrice: item.price,
      quantity,
      selectedOptions,
      notes: notes.trim(),
      imageUrl: item.imageUrl,
      imageTone: item.imageTone,
    })
  }

  return (
    <>
      <motion.div
        className={s.scrim}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />
      <div className={s.sheetWrap}>
        <motion.div
          className={s.sheet}
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.985 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
        <div className={s.sheetHero}>
          <DishImage
            photoKey={item.imageUrl}
            tone={item.imageTone}
            name={item.name}
            width={900}
            height={520}
            className={s.sheetHeroImg}
            eager
          />
          <div className={s.sheetHeroVeil} />
          <div className={s.sheetBadges}>
            {item.featured ? (
              <Badge tone="accent">
                <Sparkles size={10} /> Chef pick
              </Badge>
            ) : null}
          </div>
          <button className={s.sheetClose} onClick={onClose} aria-label="Close dish details">
            <X size={18} />
          </button>
        </div>

        <div className={s.sheetScroll}>
          <div className={s.sheetHead}>
            <h2 className={s.sheetTitle}>{item.name}</h2>
            <div className={s.sheetMetaRow}>
              <span className={s.metaChip}>
                <Clock size={13} /> about {item.prepMinutes} min
              </span>
              {item.spiceLevel > 0 ? (
                <span className={s.metaChip}>
                  <Flame size={13} /> <SpiceMeter level={item.spiceLevel} />
                </span>
              ) : null}
              {item.dietary.map((tag) => (
                <span key={tag} className={s.metaChip}>
                  {tag === 'vegetarian' || tag === 'vegan' ? <Leaf size={13} /> : null}
                  {DIETARY_LABEL[tag] ?? tag}
                </span>
              ))}
            </div>
            <p className={s.sheetDesc}>{item.description}</p>
          </div>

          {item.optionGroups.map((group) => {
            const chosen = selections[group.id] ?? []
            const atMax = group.type === 'multi' && group.maxSelections
              ? chosen.length >= group.maxSelections
              : false
            return (
              <section className={s.group} key={group.id}>
                <div className={s.groupHead}>
                  <h3 className={s.groupName}>{group.name}</h3>
                  <span className={s.groupRule}>
                    {group.required ? (
                      <span className={s.groupRequired}>Required</span>
                    ) : group.type === 'multi' && group.maxSelections ? (
                      `Choose up to ${group.maxSelections}`
                    ) : (
                      'Optional'
                    )}
                  </span>
                </div>
                <div className={s.options}>
                  {group.options.map((option) => {
                    const on = chosen.includes(option.id)
                    const blocked = !option.available || (atMax && !on)
                    return (
                      <button
                        key={option.id}
                        className={[s.option, on ? s.optionOn : ''].join(' ')}
                        disabled={blocked}
                        onClick={() => toggle(group.id, option.id, group.type, group.maxSelections)}
                        role={group.type === 'single' ? 'radio' : 'checkbox'}
                        aria-checked={on}
                      >
                        <span
                          className={[s.optionMark, group.type === 'multi' ? s.optionMarkSquare : ''].join(' ')}
                        >
                          {on ? <Check size={12} strokeWidth={3} /> : null}
                        </span>
                        <span className={s.optionName}>{option.name}</span>
                        {!option.available ? (
                          <span className={s.optionUnavailable}>finished</span>
                        ) : option.priceDelta !== 0 ? (
                          <span className={s.optionPrice}>
                            {option.priceDelta > 0 ? '+' : '−'}
                            {naira(Math.abs(option.priceDelta))}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          <section className={s.group}>
            <Field
              label="Anything the kitchen should know?"
              hint="Allergies, how you like your pepper, or how it should be served."
              htmlFor="item-notes"
            >
              <TextArea
                id="item-notes"
                value={notes}
                maxLength={200}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="No onions please. My friend is allergic."
              />
            </Field>
          </section>
        </div>

        <div className={s.sheetFooter}>
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <div className={s.footerPrice}>
            <p className={s.footerPriceLabel}>Total</p>
            <p className={s.footerPriceValue}>{naira(total)}</p>
          </div>
          <Button variant="primary" size="lg" onClick={add} disabled={missingRequired.length > 0}>
            <ShoppingBag size={16} />
            {missingRequired.length > 0 ? `Choose ${missingRequired[0].name.toLowerCase()}` : 'Add to order'}
          </Button>
        </div>
        </motion.div>
      </div>
    </>
  )
}
