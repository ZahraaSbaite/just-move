import type { AgeRange, Occasion, Style, Taste } from '@/lib/taste'
import type { Category, Gender, Product } from '@/types'

// Content-based recommendations, computed in the browser from the catalog plus the
// shopper's taste profile. No account needed and nothing leaves the device.
//
// Each product the shopper interacted with adds weight to its category, styles, colours,
// section and price. Recent and stronger actions count more. Quiz answers seed the same
// weights, so the quiz helps on a first visit and behaviour takes over as it builds up.

const ACTION_WEIGHT = { view: 1, add: 4, purchase: 6 } as const
const HALF_LIFE_MS = 14 * 86_400_000
const QUIZ_STYLE_WEIGHT = 4
const OCCASION_WEIGHT = 2
const AGE_WEIGHT = 1 // light nudge only; anything they actually click outweighs it quickly

// Pieces that finish an outfit, by category slug.
const COMPLEMENTS: Record<string, string[]> = {
  suits: ['shirts', 'shoes', 'accessories', 'outerwear'],
  blazers: ['trousers', 'shirts', 'shoes', 'knitwear'],
  shirts: ['suits', 'blazers', 'trousers', 'knitwear'],
  trousers: ['shirts', 'blazers', 'knitwear', 'shoes'],
  outerwear: ['knitwear', 'trousers', 'shoes', 'shirts'],
  knitwear: ['trousers', 'outerwear', 'shirts', 'shoes'],
  dresses: ['outerwear', 'blazers', 'shoes', 'accessories'],
  shoes: ['suits', 'trousers', 'blazers', 'dresses'],
  accessories: ['suits', 'dresses', 'blazers', 'shirts'],
}

const OCCASION_HINTS: Record<Occasion, { styles: Style[]; categories: string[] }> = {
  work: { styles: ['classic', 'smart-casual'], categories: ['suits', 'blazers', 'shirts', 'trousers'] },
  events: { styles: ['classic', 'evening'], categories: ['suits', 'dresses', 'blazers', 'shoes'] },
  everyday: { styles: ['smart-casual', 'street', 'modern'], categories: ['knitwear', 'shirts', 'trousers', 'outerwear'] },
  'night-out': { styles: ['evening', 'statement', 'modern'], categories: ['dresses', 'blazers', 'shoes'] },
  travel: { styles: ['smart-casual', 'modern'], categories: ['outerwear', 'knitwear', 'trousers'] },
}

const AGE_HINTS: Record<AgeRange, Partial<Record<Style, number>>> = {
  '18–24': { street: 1, modern: 1, statement: 0.5 },
  '25–34': { modern: 1, 'smart-casual': 1 },
  '35–44': { 'smart-casual': 1, classic: 1 },
  '45+': { classic: 1.5, 'smart-casual': 0.5 },
}

interface Signals {
  category: Map<string, number> // keyed by category slug
  style: Map<string, number>
  color: Map<string, number>
  gender: Gender | null
  logPrice: number | null
  seen: Map<string, { views: number; added: boolean; bought: boolean }>
}

const colorsOf = (p: Product) => [...new Set(p.product_variants.map((v) => v.color.trim().toLowerCase()).filter(Boolean))]
const add = (m: Map<string, number>, k: string, w: number) => m.set(k, (m.get(k) ?? 0) + w)
const normalise = (m: Map<string, number>) => {
  const max = Math.max(0, ...m.values())
  return (k: string) => (max ? (m.get(k) ?? 0) / max : 0)
}

export function hasSignals(taste: Taste) {
  return taste.quiz != null || taste.events.length > 0
}

function buildSignals(taste: Taste, byId: Map<string, Product>, slugOf: (p: Product) => string): Signals {
  const s: Signals = { category: new Map(), style: new Map(), color: new Map(), gender: null, logPrice: null, seen: new Map() }
  const genderWeight = { men: taste.browsed.men * 0.5, women: taste.browsed.women * 0.5 }
  let priceSum = 0
  let priceW = 0
  const now = Date.now()

  for (const e of taste.events) {
    const p = byId.get(e.pid)
    if (!p) continue // product removed since
    const w = ACTION_WEIGHT[e.type] * 0.5 ** ((now - e.t) / HALF_LIFE_MS)
    add(s.category, slugOf(p), w)
    p.styles.forEach((st) => add(s.style, st, w))
    const colors = colorsOf(p)
    colors.forEach((c) => add(s.color, c, w / colors.length))
    genderWeight[p.gender] += w
    priceSum += Math.log(p.price + 1) * w
    priceW += w

    const seen = s.seen.get(p.id) ?? { views: 0, added: false, bought: false }
    if (e.type === 'view') seen.views++
    if (e.type === 'add') seen.added = true
    if (e.type === 'purchase') seen.bought = true
    s.seen.set(p.id, seen)
  }

  const q = taste.quiz
  if (q) {
    q.styles.forEach((st) => add(s.style, st, QUIZ_STYLE_WEIGHT))
    for (const o of q.occasions) {
      OCCASION_HINTS[o].styles.forEach((st) => add(s.style, st, OCCASION_WEIGHT))
      OCCASION_HINTS[o].categories.forEach((c) => add(s.category, c, OCCASION_WEIGHT))
    }
    if (q.age) for (const [st, w] of Object.entries(AGE_HINTS[q.age])) add(s.style, st, w * AGE_WEIGHT)
  }

  if (q?.gender === 'men' || q?.gender === 'women') s.gender = q.gender
  else if (q?.gender !== 'both') {
    // Infer only from a clear lean — plenty of people shop for a partner too.
    const total = genderWeight.men + genderWeight.women
    if (total >= 2) {
      if (genderWeight.men / total >= 0.75) s.gender = 'men'
      else if (genderWeight.women / total >= 0.75) s.gender = 'women'
    }
  }

  if (priceW > 0) s.logPrice = priceSum / priceW
  return s
}

export type RecommendMode = 'for-you' | 'similar' | 'complete'

export function recommend(
  catalog: Product[],
  categories: Category[],
  taste: Taste,
  opts: { mode: RecommendMode; seed?: Product; exclude?: string[]; boughtTogether?: string[]; limit?: number },
): Product[] {
  const { mode, seed, limit = 4 } = opts
  const slugById = new Map(categories.map((c) => [c.id, c.slug]))
  const slugOf = (p: Product) => (p.category_id && slugById.get(p.category_id)) || 'other'
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const sig = buildSignals(taste, byId, slugOf)

  const catAff = normalise(sig.category)
  const styleAff = normalise(sig.style)
  const colorAff = normalise(sig.color)
  const exclude = new Set(opts.exclude)
  const together = new Map((opts.boughtTogether ?? []).map((id, i) => [id, 1 - i / 12]))

  const seedSlug = seed && slugOf(seed)
  const seedStyles = new Set(seed?.styles)
  const seedColors = new Set(seed && colorsOf(seed))
  const complements = seedSlug ? (COMPLEMENTS[seedSlug] ?? []) : []
  const gender = seed?.gender ?? sig.gender

  const scored: { p: Product; slug: string; score: number }[] = []
  for (const p of catalog) {
    if (p.id === seed?.id || exclude.has(p.id)) continue
    if (!p.product_variants.some((v) => v.stock > 0)) continue
    if (gender && p.gender !== gender) continue
    const slug = slugOf(p)
    const seen = sig.seen.get(p.id)
    if (seen?.bought) continue

    let score = 0
    const styles = p.styles
    const styleMatch = styles.length ? Math.max(...styles.map(styleAff)) : 0

    // What the shopper has shown they like.
    score += 2.5 * catAff(slug)
    score += 2.5 * styleMatch
    score += 0.8 * Math.max(0, ...colorsOf(p).map(colorAff))
    if (sig.logPrice != null) {
      const d = Math.log(p.price + 1) - sig.logPrice
      score += 1.5 * Math.exp(-(d * d) / (2 * 0.35 * 0.35))
    }

    // Relation to the product being viewed.
    if (seed) {
      const shared = styles.filter((st) => seedStyles.has(st)).length
      if (mode === 'similar') {
        score += slug === seedSlug ? 4 : 0
        score += 1.5 * shared
        score += colorsOf(p).some((c) => seedColors.has(c)) ? 0.5 : 0
        const d = Math.log(p.price + 1) - Math.log(seed.price + 1)
        score += 1.5 * Math.exp(-(d * d) / (2 * 0.3 * 0.3))
      } else if (mode === 'complete') {
        const rank = complements.indexOf(slug)
        if (rank === -1 && !together.has(p.id)) continue
        score += rank === -1 ? 0 : 4 - rank * 0.5
        score += 1.5 * shared
      }
      score += 5 * (together.get(p.id) ?? 0)
    }

    // Keep "For you" fresh: things already looked at often without adding drop back.
    if (mode === 'for-you' && seen) score -= seen.added ? 0.2 : Math.min(seen.views, 3) * 0.4
    if (p.is_featured) score += 0.3
    if (p.compare_at_price != null && p.compare_at_price > p.price) score += 0.2

    scored.push({ p, slug, score })
  }

  // Pick greedily, discounting categories already picked so the row isn't four of the same thing.
  const picked: typeof scored = []
  const perCategory = new Map<string, number>()
  const pool = [...scored]
  while (picked.length < limit && pool.length) {
    let best = 0
    let bestScore = -Infinity
    pool.forEach((c, i) => {
      const s = c.score - (mode === 'similar' ? 0.3 : 1.2) * (perCategory.get(c.slug) ?? 0)
      if (s > bestScore) [best, bestScore] = [i, s]
    })
    const [c] = pool.splice(best, 1)
    picked.push(c)
    perCategory.set(c.slug, (perCategory.get(c.slug) ?? 0) + 1)
  }
  return picked.map((c) => c.p)
}
