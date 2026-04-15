import type { ItemsMap, Recipe, CachedPrice } from '../types'

const ITEMS_CACHE_KEY = 'ff14_items_v1'
const RECIPES_CACHE_KEY = 'ff14_recipes_v2'  // v2: result フィールド名修正
const PRICE_CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

// ── sessionStorage helpers ─────────────────────────────────────────────────

export function getSessionItems(): ItemsMap | null {
  try {
    const raw = sessionStorage.getItem(ITEMS_CACHE_KEY)
    return raw ? (JSON.parse(raw) as ItemsMap) : null
  } catch {
    return null
  }
}

export function setSessionItems(data: ItemsMap): void {
  try {
    sessionStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage quota exceeded — ignore
  }
}

export function getSessionRecipes(): Recipe[] | null {
  try {
    const raw = sessionStorage.getItem(RECIPES_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Recipe[]) : null
  } catch {
    return null
  }
}

export function setSessionRecipes(data: Recipe[]): void {
  try {
    sessionStorage.setItem(RECIPES_CACHE_KEY, JSON.stringify(data))
  } catch {
    // quota exceeded
  }
}

// ── In-memory price cache ──────────────────────────────────────────────────

const priceCache = new Map<number, CachedPrice>()

export function getCachedPrice(itemId: number): CachedPrice | null {
  const entry = priceCache.get(itemId)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > PRICE_CACHE_TTL_MS) {
    priceCache.delete(itemId)
    return null
  }
  return entry
}

export function setCachedPrice(itemId: number, entry: CachedPrice): void {
  priceCache.set(itemId, entry)
}

export function getCachedPrices(itemIds: number[]): {
  hits: Map<number, CachedPrice>
  misses: number[]
} {
  const hits = new Map<number, CachedPrice>()
  const misses: number[] = []
  for (const id of itemIds) {
    const cached = getCachedPrice(id)
    if (cached) {
      hits.set(id, cached)
    } else {
      misses.push(id)
    }
  }
  return { hits, misses }
}
