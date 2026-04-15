export interface ItemData {
  en: string
  ja: string
}

export type ItemsMap = Record<string, ItemData>

export interface RecipeIngredient {
  id: number
  amount: number
}

export interface Recipe {
  id: number
  result: number       // 完成品アイテムID（JSONのフィールド名は "result"）
  yields: number
  ingredients: RecipeIngredient[]
  job?: number
  lvl?: number
}

// Universalis current price response
export interface UniversalisListing {
  pricePerUnit: number
  quantity: number
  hq: boolean
  worldName?: string
}

export interface UniversalisItem {
  itemID: number
  minPrice: number
  minPriceNQ: number
  minPriceHQ: number
  averagePrice: number
  averagePriceNQ: number
  averagePriceHQ: number
  listings: UniversalisListing[]
}

export interface UniversalisMultiResponse {
  items: Record<string, UniversalisItem>
  // also returned when fetching a single item directly
  itemID?: number
  minPrice?: number
  minPriceNQ?: number
  minPriceHQ?: number
  averagePrice?: number
  averagePriceNQ?: number
  averagePriceHQ?: number
  listings?: UniversalisListing[]
}

// Universalis history
export interface HistoryEntry {
  hq: boolean
  pricePerUnit: number
  quantity: number
  timestamp: number
}

export interface UniversalisHistory {
  itemID: number
  entries: HistoryEntry[]
}

// Computed daily stat
export interface DailyStat {
  date: string     // "YYYY-MM-DD"
  low: number
  high: number
  volume: number
}

// Cached price entry (with expiry)
export interface CachedPrice {
  data: UniversalisItem
  fetchedAt: number
}
