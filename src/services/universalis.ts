import type {
  UniversalisItem,
  UniversalisMultiResponse,
  UniversalisHistory,
  HistoryEntry,
} from '../types'
import { getCachedPrice, getCachedPrices, setCachedPrice } from './cache'

const BASE = 'https://universalis.app/api/v2'
const WORLD = 'meteor'
const BATCH_SIZE = 100

// ── Price fetch ────────────────────────────────────────────────────────────

async function fetchBatch(ids: number[]): Promise<UniversalisItem[]> {
  const joined = ids.join(',')
  const res = await fetch(`${BASE}/${WORLD}/${joined}`)
  if (!res.ok) throw new Error(`Universalis API error: ${res.status}`)
  const json = (await res.json()) as UniversalisMultiResponse

  // Single item returns the item directly; multiple items returns { items: {...} }
  if (ids.length === 1) {
    const single = json as unknown as UniversalisItem
    return [single]
  }

  return Object.values(json.items ?? {})
}

export async function fetchPrices(
  itemIds: number[]
): Promise<Map<number, UniversalisItem>> {
  const result = new Map<number, UniversalisItem>()
  const { hits, misses } = getCachedPrices(itemIds)

  // Fill from cache
  for (const [id, cached] of hits) {
    result.set(id, cached.data)
  }

  if (misses.length === 0) return result

  // Batch-fetch missing items
  for (let i = 0; i < misses.length; i += BATCH_SIZE) {
    const batch = misses.slice(i, i + BATCH_SIZE)
    const items = await fetchBatch(batch)
    const now = Date.now()
    for (const item of items) {
      result.set(item.itemID, item)
      setCachedPrice(item.itemID, { data: item, fetchedAt: now })
    }
  }

  return result
}

export async function fetchPrice(itemId: number): Promise<UniversalisItem> {
  const cached = getCachedPrice(itemId)
  if (cached) return cached.data

  const [item] = await fetchBatch([itemId])
  setCachedPrice(itemId, { data: item, fetchedAt: Date.now() })
  return item
}

// ── History fetch ──────────────────────────────────────────────────────────

// 常に30日分取得し、クライアント側で期間フィルタ
const HISTORY_FETCH_DAYS = 30

export async function fetchHistory(itemId: number): Promise<HistoryEntry[]> {
  const entriesWithin = HISTORY_FETCH_DAYS * 86400
  const res = await fetch(
    `${BASE}/history/${WORLD}/${itemId}?entriesWithin=${entriesWithin}&entriesToReturn=99999`
  )
  if (!res.ok) throw new Error(`History API error: ${res.status}`)
  const json = (await res.json()) as UniversalisHistory
  return json.entries ?? []
}

// ── Most-recently-updated (Trend tab — phase 2) ────────────────────────────

export interface TrendItem {
  itemID: number
  worldUploadTimes: Record<string, number>
}

export async function fetchMostRecentlyUpdated(): Promise<TrendItem[]> {
  const res = await fetch(
    `${BASE}/extra/stats/most-recently-updated?dcName=${WORLD}`
  )
  if (!res.ok) throw new Error(`Trend API error: ${res.status}`)
  const json = await res.json()
  return (json.items ?? []) as TrendItem[]
}
