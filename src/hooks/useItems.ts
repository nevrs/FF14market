import { useState, useEffect } from 'react'
import type { ItemsMap } from '../types'
import { getSessionItems, setSessionItems } from '../services/cache'

const ITEMS_URL =
  'https://cdn.jsdelivr.net/gh/ffxiv-teamcraft/ffxiv-teamcraft@staging/libs/data/src/lib/json/items.json'

interface UseItemsResult {
  items: ItemsMap | null
  loading: boolean
  error: string | null
}

export function useItems(): UseItemsResult {
  const [items, setItems] = useState<ItemsMap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = getSessionItems()
    if (cached) {
      setItems(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(ITEMS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`items.json fetch failed: ${res.status}`)
        return res.json() as Promise<ItemsMap>
      })
      .then((data) => {
        if (cancelled) return
        setSessionItems(data)
        setItems(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'アイテムデータの取得に失敗しました')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { items, loading, error }
}

/** アイテム名でインクリメンタル検索（日本語・英語、部分一致） */
export function searchItems(
  items: ItemsMap,
  query: string,
  limit = 30
): { id: string; ja: string; en: string }[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: { id: string; ja: string; en: string }[] = []

  for (const [id, data] of Object.entries(items)) {
    if (
      data.ja?.toLowerCase().includes(q) ||
      data.en?.toLowerCase().includes(q)
    ) {
      results.push({ id, ja: data.ja ?? '', en: data.en ?? '' })
      if (results.length >= limit) break
    }
  }

  return results
}
