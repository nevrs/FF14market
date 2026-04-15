import type { HistoryEntry, DailyStat, UniversalisItem } from '../types'

/** NQ/HQ フォールバック付き最安値取得 (GAS: minPrice || minPriceHQ || averagePrice) */
export function getEffectivePrice(item: UniversalisItem, preferHQ: boolean): number {
  if (preferHQ) {
    return item.minPriceHQ || item.minPriceNQ || item.minPrice || item.averagePrice || 0
  }
  return item.minPriceNQ || item.minPrice || item.minPriceHQ || item.averagePrice || 0
}

/** タイムスタンプ → "YYYY-MM-DD" */
function toDateString(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10)
}

/**
 * GAS: calculateDailyStatistics
 * 履歴エントリを日別に集計し、安値・高値・取引量を返す（直近7日分）
 */
export function calculateDailyStatistics(entries: HistoryEntry[]): DailyStat[] {
  const byDate = new Map<string, { prices: number[]; volume: number }>()

  for (const e of entries) {
    const date = toDateString(e.timestamp)
    if (!byDate.has(date)) byDate.set(date, { prices: [], volume: 0 })
    const day = byDate.get(date)!
    day.prices.push(e.pricePerUnit)
    day.volume += e.quantity
  }

  const stats: DailyStat[] = []
  for (const [date, { prices, volume }] of byDate) {
    stats.push({
      date,
      low: Math.min(...prices),
      high: Math.max(...prices),
      volume,
    })
  }

  // Sort descending, keep last 7 days, then return ascending for chart
  stats.sort((a, b) => b.date.localeCompare(a.date))
  return stats.slice(0, 7).reverse()
}

/**
 * GAS: gotoStackSizeHistogram
 * 直近24時間の取引量を合計し、1日あたり取引個数を返す
 */
export function calculateDailyVolume(entries: HistoryEntry[]): number {
  const oneDayAgo = Date.now() / 1000 - 86400
  let total = 0
  for (const e of entries) {
    if (e.timestamp >= oneDayAgo) {
      total += e.quantity
    }
  }
  return total
}

export interface CraftIngredientRow {
  id: number
  amount: number
  nqUnitPrice: number
  hqUnitPrice: number
  nqSubtotal: number
  hqSubtotal: number
}

export interface CraftCostResult {
  breakdown: CraftIngredientRow[]
  /** yields で割った1個あたり NQ素材合計コスト */
  totalNQCost: number
  /** yields で割った1個あたり HQ素材合計コスト */
  totalHQCost: number
}

/**
 * GAS: gotoCreateCost (素材コスト計算) — NQ/HQ 両方を同時に算出
 * yields で割って 1個あたりのコストを返す
 */
export function calculateCraftCost(
  ingredients: { id: number; amount: number }[],
  priceMap: Map<number, UniversalisItem>,
  yields: number
): CraftCostResult {
  let rawNQ = 0
  let rawHQ = 0
  const breakdown: CraftIngredientRow[] = []

  for (const ing of ingredients) {
    const item = priceMap.get(ing.id)
    const nqUnitPrice = item ? (item.minPriceNQ || item.minPrice || item.minPriceHQ || item.averagePrice || 0) : 0
    const hqUnitPrice = item ? (item.minPriceHQ || item.minPriceNQ || item.minPrice || item.averagePrice || 0) : 0
    const nqSubtotal = nqUnitPrice * ing.amount
    const hqSubtotal = hqUnitPrice * ing.amount
    rawNQ += nqSubtotal
    rawHQ += hqSubtotal
    breakdown.push({ id: ing.id, amount: ing.amount, nqUnitPrice, hqUnitPrice, nqSubtotal, hqSubtotal })
  }

  const div = yields > 1 ? yields : 1
  return {
    breakdown,
    totalNQCost: rawNQ / div,
    totalHQCost: rawHQ / div,
  }
}

/** 数値を日本語カンマ区切りにフォーマット */
export function formatGil(value: number): string {
  if (!value || isNaN(value)) return '—'
  return Math.round(value).toLocaleString('ja-JP') + ' G'
}
