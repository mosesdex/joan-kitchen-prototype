import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Leaf, Plus, SearchX, Sparkles, X } from 'lucide-react'
import { CategoryIcon } from '../../components/CategoryIcon'
import { DishImage } from '../../components/DishImage'
import { Badge, EmptyState, Skeleton, SpiceMeter } from '../../components/ui'
import { dishImage } from '../../data/images'
import { naira } from '../../lib/money'
import { useStore } from '../../store/useStore'
import { activeCategories, itemsInCategory } from '../../store/selectors'
import type { MenuItem } from '../../types'
import s from './customer.module.css'

type Filter = 'vegetarian' | 'mild' | 'featured'

const FILTER_LABELS: Record<Filter, string> = {
  featured: 'Chef picks',
  vegetarian: 'Vegetarian',
  mild: 'Not spicy',
}

function matchesFilters(item: MenuItem, filters: Set<Filter>): boolean {
  if (filters.has('featured') && !item.featured) return false
  if (filters.has('vegetarian') && !item.dietary.some((d) => d === 'vegetarian' || d === 'vegan'))
    return false
  if (filters.has('mild') && item.spiceLevel > 1) return false
  return true
}

export function MenuScreen({
  search,
  onOpenItem,
}: {
  search: string
  onOpenItem: (item: MenuItem) => void
}) {
  const state = useStore()
  const categories = useMemo(() => activeCategories(state), [state.categories])
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [filters, setFilters] = useState<Set<Filter>>(new Set())
  // First paint shows skeletons — the menu would come from an API in production.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 620)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!categories.some((c) => c.id === categoryId) && categories[0]) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const searching = search.trim().length > 0
  const category = categories.find((c) => c.id === categoryId)

  const items = useMemo(() => {
    const pool = searching
      ? state.menuItems.filter((item) => {
          const q = search.trim().toLowerCase()
          return (
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          )
        })
      : itemsInCategory(state, categoryId)
    return pool.filter((item) => matchesFilters(item, filters))
  }, [state.menuItems, categoryId, search, searching, filters])

  const toggleFilter = (filter: Filter) =>
    setFilters((current) => {
      const next = new Set(current)
      if (next.has(filter)) next.delete(filter)
      else next.add(filter)
      return next
    })

  return (
    <div className={s.body}>
      <aside className={s.rail} aria-label="Menu categories">
        <div className={s.railGroup}>
          <p className={s.railLabel}>Menu</p>
          {categories.map((c) => {
            const count = itemsInCategory(state, c.id).filter((i) => i.available).length
            return (
              <button
                key={c.id}
                className={[s.railItem, c.id === categoryId && !searching ? s.railItemActive : ''].join(' ')}
                onClick={() => setCategoryId(c.id)}
              >
                <CategoryIcon name={c.icon} />
                {c.name}
                <span className={s.railCount}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className={s.railGroup}>
          <p className={s.railLabel}>Filter</p>
          <div className={s.filters}>
            {(Object.keys(FILTER_LABELS) as Filter[]).map((filter) => (
              <button
                key={filter}
                className={[s.filterChip, filters.has(filter) ? s.filterChipOn : ''].join(' ')}
                onClick={() => toggleFilter(filter)}
                aria-pressed={filters.has(filter)}
              >
                {FILTER_LABELS[filter]}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className={s.main}>
        {!searching && category ? (
          <>
            {category.sortOrder === 1 ? (
              <div className={s.hero}>
                <img src={dishImage('hero', 1600, 500)} alt="" />
                <div className={s.heroVeil} />
                <div className={s.heroCopy}>
                  <h2 className={s.heroTitle}>Cooked over fire, served hot</h2>
                  <p className={s.heroSub}>
                    Everything on this menu is made to order. Tap a dish to choose your swallow,
                    protein and pepper level.
                  </p>
                </div>
              </div>
            ) : null}

            <div className={s.sectionHead}>
              <div>
                <h2 className={s.sectionTitle}>{category.name}</h2>
                <p className={s.sectionBlurb}>{category.blurb}</p>
              </div>
              <Badge tone="neutral">{items.length} dishes</Badge>
            </div>
          </>
        ) : null}

        {searching ? (
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>Results for “{search.trim()}”</h2>
              <p className={s.sectionBlurb}>
                {items.length} {items.length === 1 ? 'dish' : 'dishes'} across the whole menu
              </p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className={s.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={s.card}>
                <Skeleton height={168} radius={0} />
                <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 8 }}>
                  <Skeleton width="70%" height={15} />
                  <Skeleton width="100%" height={11} />
                  <Skeleton width="45%" height={11} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          searching ? (
            <EmptyState
              icon={<SearchX size={24} />}
              title="Nothing matched that"
              body="Try a shorter word — “jollof”, “suya”, “zobo” — or clear the filters and browse by category."
            />
          ) : (
            <EmptyState
              icon={<X size={24} />}
              title="Nothing here right now"
              body="Everything in this category is off the menu today. Your server can tell you what is coming back."
            />
          )
        ) : (
          <motion.div className={s.grid} layout>
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <ItemCard key={item.id} item={item} index={index} onOpen={() => onOpenItem(item)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  )
}

function ItemCard({
  item,
  index,
  onOpen,
}: {
  item: MenuItem
  index: number
  onOpen: () => void
}) {
  const vegetarian = item.dietary.some((d) => d === 'vegetarian' || d === 'vegan')
  return (
    <motion.button
      layout
      className={s.card}
      onClick={onOpen}
      disabled={!item.available}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.02, 0.18), ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${item.name}, ${naira(item.price)}${item.available ? '' : ', unavailable'}`}
    >
      <DishImage
        photoKey={item.imageUrl}
        tone={item.imageTone}
        name={item.name}
        width={480}
        height={360}
        className={s.cardImage}
        eager={index < 4}
      >
        <div className={s.cardBadges}>
          {item.featured ? (
            <Badge tone="accent">
              <Sparkles size={10} /> Chef pick
            </Badge>
          ) : null}
          {vegetarian ? (
            <Badge tone="success">
              <Leaf size={10} /> Veg
            </Badge>
          ) : null}
        </div>
        {!item.available ? (
          <div className={s.cardUnavailable}>
            <Badge tone="danger">Finished for today</Badge>
          </div>
        ) : null}
      </DishImage>

      <div className={s.cardBody}>
        <div className={s.cardTitleRow}>
          <span className={s.cardName}>{item.name}</span>
          <span className={s.cardPrice}>{naira(item.price)}</span>
        </div>
        <p className={s.cardDesc}>{item.description}</p>
        <div className={s.cardMeta}>
          <span className={s.metaItem}>
            <Clock size={11} /> {item.prepMinutes} min
          </span>
          {item.spiceLevel > 0 ? (
            <span className={s.metaItem}>
              <SpiceMeter level={item.spiceLevel} />
            </span>
          ) : null}
          {item.available ? (
            <span className={s.cardAdd} aria-hidden="true">
              <Plus size={15} />
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  )
}
