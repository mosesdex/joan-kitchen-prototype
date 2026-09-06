import {
  Beef,
  Cookie,
  CupSoda,
  Flame,
  IceCreamCone,
  Salad,
  Soup,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Category icons are stored as names so admin can change them without code. */
const ICONS: Record<string, LucideIcon> = {
  soup: Soup,
  wheat: Wheat,
  flame: Flame,
  beef: Beef,
  cookie: Cookie,
  salad: Salad,
  'cup-soda': CupSoda,
  'ice-cream-cone': IceCreamCone,
  utensils: UtensilsCrossed,
}

export const CATEGORY_ICON_NAMES = Object.keys(ICONS)

export function CategoryIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? UtensilsCrossed
  return <Icon size={size} />
}
