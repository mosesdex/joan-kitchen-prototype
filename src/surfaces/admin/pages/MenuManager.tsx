import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { CategoryIcon, CATEGORY_ICON_NAMES } from '../../../components/CategoryIcon'
import { DishImage } from '../../../components/DishImage'
import { Badge, Button, EmptyState, Field, Select, TextArea, TextInput, Toggle } from '../../../components/ui'
import { useToast } from '../../../components/Toaster'
import { PHOTOS } from '../../../data/images'
import { makeId } from '../../../lib/id'
import { naira } from '../../../lib/money'
import { useStore } from '../../../store/useStore'
import { itemsInCategory } from '../../../store/selectors'
import type { Category, MenuItem, OptionGroup } from '../../../types'
import { ConfirmModal, Modal } from '../Modal'
import s from '../admin.module.css'

const PHOTO_KEYS = Object.keys(PHOTOS).filter((key) => key !== 'hero' && key !== 'restaurant')
const TONES: MenuItem['imageTone'][] = ['ember', 'clay', 'palm', 'gold', 'char', 'cream']

export function MenuManager() {
  const categories = useStore((state) => state.categories)
  const menuItems = useStore((state) => state.menuItems)
  const upsertCategory = useStore((state) => state.upsertCategory)
  const deleteCategory = useStore((state) => state.deleteCategory)
  const reorderCategories = useStore((state) => state.reorderCategories)
  const upsertMenuItem = useStore((state) => state.upsertMenuItem)
  const deleteMenuItem = useStore((state) => state.deleteMenuItem)
  const reorderMenuItems = useStore((state) => state.reorderMenuItems)
  const toast = useToast()

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  )
  const [categoryId, setCategoryId] = useState(sorted[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const category = sorted.find((c) => c.id === categoryId) ?? sorted[0]
  const items = useMemo(() => {
    const pool = category ? itemsInCategory({ menuItems }, category.id) : []
    if (!search.trim()) return pool
    const q = search.trim().toLowerCase()
    return pool.filter((item) => item.name.toLowerCase().includes(q))
  }, [menuItems, category, search])

  const moveCategory = (index: number, direction: -1 | 1) => {
    const next = [...sorted]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderCategories(next.map((c) => c.id))
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const ordered = [...items]
    const target = index + direction
    if (target < 0 || target >= ordered.length) return
    ;[ordered[index], ordered[target]] = [ordered[target], ordered[index]]
    if (category) reorderMenuItems(category.id, ordered.map((i) => i.id))
  }

  const blankItem = (): MenuItem => ({
    id: makeId('itm'),
    categoryId: category?.id ?? '',
    name: '',
    description: '',
    price: 0,
    imageUrl: PHOTO_KEYS[0],
    imageTone: 'ember',
    spiceLevel: 0,
    dietary: [],
    optionGroups: [],
    available: true,
    featured: false,
    prepMinutes: 12,
    sortOrder: items.length + 1,
  })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
      <div className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Menu</h1>
          <p className={s.pageSub}>
            {menuItems.length} dishes across {categories.length} categories ·{' '}
            {menuItems.filter((i) => !i.available).length} currently off
          </p>
        </div>
        <div className={s.pageActions}>
          <Button
            variant="secondary"
            onClick={() =>
              setEditingCategory({
                id: makeId('cat'),
                name: '',
                blurb: '',
                icon: 'utensils',
                sortOrder: sorted.length + 1,
                active: true,
              })
            }
          >
            <Plus size={15} /> New category
          </Button>
          <Button variant="primary" onClick={() => setEditingItem(blankItem())} disabled={!category}>
            <Plus size={15} /> New dish
          </Button>
        </div>
      </div>

      <div className={s.menuLayout}>
        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>Categories</h2>
          </header>
          <div style={{ padding: 'var(--space-2)' }}>
            {sorted.map((c, index) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  className={[s.catRow, c.id === category?.id ? s.catRowActive : ''].join(' ')}
                  onClick={() => setCategoryId(c.id)}
                >
                  <span className={s.catDrag}>
                    <GripVertical size={13} />
                  </span>
                  <CategoryIcon name={c.icon} size={15} />
                  <span style={{ flex: 1 }}>{c.name}</span>
                  {!c.active ? <Badge tone="neutral">hidden</Badge> : null}
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                    {itemsInCategory({ menuItems }, c.id).length}
                  </span>
                </button>
                <div style={{ display: 'grid' }}>
                  <button
                    onClick={() => moveCategory(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${c.name} up`}
                    style={{ padding: 2, color: 'var(--text-muted)', opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => moveCategory(index, 1)}
                    disabled={index === sorted.length - 1}
                    aria-label={`Move ${c.name} down`}
                    style={{
                      padding: 2,
                      color: 'var(--text-muted)',
                      opacity: index === sorted.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={s.panel}>
          <header className={s.panelHead}>
            <h2 className={s.panelTitle}>{category?.name ?? 'No category'}</h2>
            {category ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category)}>
                  <Pencil size={13} /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeletingCategory(category)}>
                  <Trash2 size={13} />
                </Button>
              </>
            ) : null}
          </header>

          <div style={{ padding: 'var(--space-4) var(--space-4) 0' }}>
            <div className={s.searchBox}>
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a dish in this category"
                aria-label="Search dishes"
              />
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={<UtensilsCrossed size={22} />}
              title={search ? 'No dish matches that' : 'This category is empty'}
              body={
                search
                  ? 'Try a different word, or clear the search to see everything in this category.'
                  : 'Add the first dish and it will appear on the customer menu straight away.'
              }
              action={
                search ? null : (
                  <Button variant="primary" onClick={() => setEditingItem(blankItem())}>
                    <Plus size={15} /> Add a dish
                  </Button>
                )
              }
            />
          ) : (
            <div style={{ marginTop: 'var(--space-4)' }}>
              {items.map((item, index) => (
                <div className={s.itemRow} key={item.id}>
                  <div style={{ display: 'grid' }}>
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${item.name} up`}
                      style={{ color: 'var(--text-muted)', opacity: index === 0 ? 0.3 : 1 }}
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move ${item.name} down`}
                      style={{ color: 'var(--text-muted)', opacity: index === items.length - 1 ? 0.3 : 1 }}
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <DishImage
                    photoKey={item.imageUrl}
                    tone={item.imageTone}
                    name={item.name || 'New dish'}
                    width={160}
                    height={120}
                    className={s.itemThumb}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p className={s.itemName}>{item.name || 'Untitled dish'}</p>
                    <p className={s.itemDesc}>{item.description || 'No description yet'}</p>
                  </div>
                  <span className={s.num} style={{ fontWeight: 600 }}>
                    {naira(item.price)}
                  </span>
                  <Toggle
                    checked={item.available}
                    onChange={(available) => {
                      upsertMenuItem({ ...item, available })
                      toast.success(
                        available ? `${item.name} is back on` : `${item.name} taken off`,
                        'Customer menus update immediately.',
                      )
                    }}
                    ariaLabel={`${item.name} availability`}
                  />
                  <div className={s.rowActions}>
                    <Button variant="ghost" size="sm" iconOnly onClick={() => setEditingItem(item)} aria-label={`Edit ${item.name}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" iconOnly onClick={() => setDeletingItem(item)} aria-label={`Delete ${item.name}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {editingItem ? (
          <ItemEditor
            item={editingItem}
            categories={sorted}
            onClose={() => setEditingItem(null)}
            onSave={(item) => {
              upsertMenuItem(item)
              setEditingItem(null)
              toast.success(`${item.name} saved`, 'The customer menu has been updated.')
            }}
          />
        ) : null}

        {editingCategory ? (
          <CategoryEditor
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
            onSave={(next) => {
              upsertCategory(next)
              setCategoryId(next.id)
              setEditingCategory(null)
              toast.success(`${next.name} saved`)
            }}
          />
        ) : null}

        {deletingItem ? (
          <ConfirmModal
            title={`Delete ${deletingItem.name}?`}
            body="It disappears from the customer menu immediately. Orders already placed keep their record of it."
            onClose={() => setDeletingItem(null)}
            onConfirm={() => {
              deleteMenuItem(deletingItem.id)
              toast.info(`${deletingItem.name} deleted`)
              setDeletingItem(null)
            }}
          />
        ) : null}

        {deletingCategory ? (
          <ConfirmModal
            title={`Delete ${deletingCategory.name}?`}
            body={`Every dish inside it is deleted too — ${itemsInCategory({ menuItems }, deletingCategory.id).length} in total. This cannot be undone.`}
            confirmLabel="Delete category and dishes"
            onClose={() => setDeletingCategory(null)}
            onConfirm={() => {
              deleteCategory(deletingCategory.id)
              setCategoryId(sorted.find((c) => c.id !== deletingCategory.id)?.id ?? '')
              toast.info(`${deletingCategory.name} deleted`)
              setDeletingCategory(null)
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

function CategoryEditor({
  category,
  onClose,
  onSave,
}: {
  category: Category
  onClose: () => void
  onSave: (category: Category) => void
}) {
  const [draft, setDraft] = useState(category)
  const invalid = draft.name.trim().length === 0

  return (
    <Modal
      title={category.name ? `Edit ${category.name}` : 'New category'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={invalid} onClick={() => onSave(draft)}>
            Save category
          </Button>
        </>
      }
    >
      <Field label="Name" error={invalid ? 'Give the category a name' : undefined} htmlFor="cat-name">
        <TextInput
          id="cat-name"
          value={draft.name}
          invalid={invalid}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder="Swallow & soups"
        />
      </Field>
      <Field label="Short line shown to guests" htmlFor="cat-blurb">
        <TextInput
          id="cat-blurb"
          value={draft.blurb}
          onChange={(event) => setDraft({ ...draft, blurb: event.target.value })}
          placeholder="Slow-cooked soups with your choice of swallow"
        />
      </Field>
      <Field label="Icon" htmlFor="cat-icon">
        <Select
          id="cat-icon"
          value={draft.icon}
          onChange={(event) => setDraft({ ...draft, icon: event.target.value })}
        >
          {CATEGORY_ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
      <Toggle
        checked={draft.active}
        onChange={(active) => setDraft({ ...draft, active })}
        label="Show on the customer menu"
        description="Hidden categories stay in the back office but disappear from the iPads."
      />
    </Modal>
  )
}

function ItemEditor({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem
  categories: Category[]
  onClose: () => void
  onSave: (item: MenuItem) => void
}) {
  const [draft, setDraft] = useState(item)
  const [tab, setTab] = useState<'details' | 'options'>('details')
  const nameInvalid = draft.name.trim().length === 0
  const priceInvalid = draft.price <= 0

  const patch = (next: Partial<MenuItem>) => setDraft((current) => ({ ...current, ...next }))

  const addGroup = () =>
    patch({
      optionGroups: [
        ...draft.optionGroups,
        {
          id: makeId('og'),
          name: 'New option group',
          type: 'single',
          required: false,
          options: [{ id: makeId('opt'), name: 'Option one', priceDelta: 0, available: true }],
        },
      ],
    })

  const patchGroup = (groupId: string, next: Partial<OptionGroup>) =>
    patch({
      optionGroups: draft.optionGroups.map((group) =>
        group.id === groupId ? { ...group, ...next } : group,
      ),
    })

  return (
    <Modal
      title={item.name ? `Edit ${item.name}` : 'New dish'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={nameInvalid || priceInvalid}
            onClick={() => onSave({ ...draft, name: draft.name.trim() })}
          >
            Save dish
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className={[s.chip, tab === 'details' ? s.chipOn : ''].join(' ')}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button
          className={[s.chip, tab === 'options' ? s.chipOn : ''].join(' ')}
          onClick={() => setTab('options')}
        >
          Options ({draft.optionGroups.length})
        </button>
      </div>

      {tab === 'details' ? (
        <>
          <div className={s.formGrid}>
            <div className={s.formGridFull}>
              <Field label="Name" error={nameInvalid ? 'A dish needs a name' : undefined} htmlFor="item-name">
                <TextInput
                  id="item-name"
                  value={draft.name}
                  invalid={nameInvalid}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder="Party jollof rice"
                />
              </Field>
            </div>

            <div className={s.formGridFull}>
              <Field label="Description" htmlFor="item-desc">
                <TextArea
                  id="item-desc"
                  value={draft.description}
                  onChange={(event) => patch({ description: event.target.value })}
                  placeholder="Long grain rice cooked down in a smoky pepper base over firewood."
                />
              </Field>
            </div>

            <Field
              label="Price (₦)"
              error={priceInvalid ? 'Set a price above zero' : undefined}
              htmlFor="item-price"
            >
              <TextInput
                id="item-price"
                type="number"
                min={0}
                step={50}
                value={draft.price / 100}
                invalid={priceInvalid}
                onChange={(event) => patch({ price: Math.round(Number(event.target.value) * 100) })}
              />
            </Field>

            <Field label="Prep time (minutes)" htmlFor="item-prep">
              <TextInput
                id="item-prep"
                type="number"
                min={1}
                max={90}
                value={draft.prepMinutes}
                onChange={(event) => patch({ prepMinutes: Number(event.target.value) })}
              />
            </Field>

            <Field label="Category" htmlFor="item-cat">
              <Select
                id="item-cat"
                value={draft.categoryId}
                onChange={(event) => patch({ categoryId: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Spice level" htmlFor="item-spice">
              <Select
                id="item-spice"
                value={draft.spiceLevel}
                onChange={(event) => patch({ spiceLevel: Number(event.target.value) as MenuItem['spiceLevel'] })}
              >
                <option value={0}>Not spicy</option>
                <option value={1}>Mild</option>
                <option value={2}>Medium</option>
                <option value={3}>Hot</option>
              </Select>
            </Field>

            <div className={s.formGridFull}>
              <Field
                label="Photo"
                hint="Production uploads a file; the prototype picks from a stock library."
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))',
                    gap: 8,
                    maxHeight: 178,
                    overflowY: 'auto',
                    padding: 4,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  {PHOTO_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => patch({ imageUrl: key })}
                      aria-label={`Use ${key} photo`}
                      style={{
                        borderRadius: 6,
                        overflow: 'hidden',
                        outline:
                          key === draft.imageUrl ? '2px solid var(--accent)' : '1px solid var(--border)',
                        outlineOffset: key === draft.imageUrl ? 1 : 0,
                        aspectRatio: '4 / 3',
                        containerType: 'inline-size',
                      }}
                    >
                      <DishImage photoKey={key} tone={draft.imageTone} name={key} width={160} height={120} />
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Fallback tint" hint="Used when the photo cannot load." htmlFor="item-tone">
              <Select
                id="item-tone"
                value={draft.imageTone}
                onChange={(event) => patch({ imageTone: event.target.value as MenuItem['imageTone'] })}
              >
                {TONES.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </Select>
            </Field>

            <div style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'end' }}>
              <Toggle
                checked={draft.available}
                onChange={(available) => patch({ available })}
                label="Available today"
              />
              <Toggle
                checked={draft.featured}
                onChange={(featured) => patch({ featured })}
                label="Mark as a chef pick"
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {draft.optionGroups.length === 0 ? (
            <EmptyState
              icon={<ImageIcon size={22} />}
              title="No options on this dish"
              body="Add a group for things like choice of swallow, protein or pepper level."
              action={
                <Button variant="primary" onClick={addGroup}>
                  <Plus size={15} /> Add option group
                </Button>
              }
            />
          ) : (
            <>
              {draft.optionGroups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 'var(--space-4)',
                    display: 'grid',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Field label="Group name">
                        <TextInput
                          value={group.name}
                          onChange={(event) => patchGroup(group.id, { name: event.target.value })}
                        />
                      </Field>
                    </div>
                    <div style={{ width: 130 }}>
                      <Field label="Type">
                        <Select
                          value={group.type}
                          onChange={(event) =>
                            patchGroup(group.id, { type: event.target.value as OptionGroup['type'] })
                          }
                        >
                          <option value="single">Pick one</option>
                          <option value="multi">Pick many</option>
                        </Select>
                      </Field>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label={`Remove ${group.name}`}
                      onClick={() =>
                        patch({ optionGroups: draft.optionGroups.filter((g) => g.id !== group.id) })
                      }
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <Toggle
                    checked={group.required}
                    onChange={(required) => patchGroup(group.id, { required })}
                    label="Guest must choose"
                  />

                  {group.options.map((option) => (
                    <div key={option.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <TextInput
                        value={option.name}
                        onChange={(event) =>
                          patchGroup(group.id, {
                            options: group.options.map((o) =>
                              o.id === option.id ? { ...o, name: event.target.value } : o,
                            ),
                          })
                        }
                        aria-label="Option name"
                      />
                      <TextInput
                        type="number"
                        step={50}
                        value={option.priceDelta / 100}
                        onChange={(event) =>
                          patchGroup(group.id, {
                            options: group.options.map((o) =>
                              o.id === option.id
                                ? { ...o, priceDelta: Math.round(Number(event.target.value) * 100) }
                                : o,
                            ),
                          })
                        }
                        style={{ width: 108 }}
                        aria-label="Price change in naira"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label={`Remove ${option.name}`}
                        onClick={() =>
                          patchGroup(group.id, {
                            options: group.options.filter((o) => o.id !== option.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      patchGroup(group.id, {
                        options: [
                          ...group.options,
                          { id: makeId('opt'), name: '', priceDelta: 0, available: true },
                        ],
                      })
                    }
                  >
                    <Plus size={13} /> Add option
                  </Button>
                </div>
              ))}
              <Button variant="secondary" onClick={addGroup}>
                <Plus size={15} /> Add another group
              </Button>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
