import { useState, useCallback } from 'react'
import type { UniversalisItem, HistoryEntry, DailyStat } from '../types'
import { fetchPrice, fetchHistory } from '../services/universalis'
import { calculateDailyStatistics, calculateDailyVolume } from '../utils/calculations'

interface PriceState {
  item: UniversalisItem | null
  history: HistoryEntry[]
  dailyStats: DailyStat[]
  dailyVolume: number
  loading: boolean
  error: string | null
}

const INITIAL: PriceState = {
  item: null,
  history: [],
  dailyStats: [],
  dailyVolume: 0,
  loading: false,
  error: null,
}

export function usePrice() {
  const [state, setState] = useState<PriceState>(INITIAL)

  const load = useCallback(async (itemId: number) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [item, history] = await Promise.all([
        fetchPrice(itemId),
        fetchHistory(itemId),
      ])
      const dailyStats = calculateDailyStatistics(history)
      const dailyVolume = calculateDailyVolume(history)
      setState({ item, history, dailyStats, dailyVolume, loading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : '価格データの取得に失敗しました',
      }))
    }
  }, [])

  const reset = useCallback(() => setState(INITIAL), [])

  return { ...state, load, reset }
}

interface MultiplePricesState {
  prices: Map<number, UniversalisItem>
  loading: boolean
  error: string | null
}

import { fetchPrices } from '../services/universalis'

export function useMultiplePrices() {
  const [state, setState] = useState<MultiplePricesState>({
    prices: new Map(),
    loading: false,
    error: null,
  })

  const load = useCallback(async (itemIds: number[]) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const prices = await fetchPrices(itemIds)
      setState({ prices, loading: false, error: null })
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : '価格データの取得に失敗しました',
      }))
    }
  }, [])

  const reset = useCallback(
    () => setState({ prices: new Map(), loading: false, error: null }),
    []
  )

  return { ...state, load, reset }
}
