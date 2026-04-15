import { useState, useCallback, useRef } from 'react'
import type { Recipe } from '../types'
import { getSessionRecipes, setSessionRecipes } from '../services/cache'

const RECIPES_URL =
  'https://cdn.jsdelivr.net/gh/ffxiv-teamcraft/ffxiv-teamcraft@staging/libs/data/src/lib/json/recipes.json'

interface UseRecipesResult {
  recipes: Recipe[] | null
  loading: boolean
  error: string | null
  load: () => Promise<void>
}

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // ref で「すでにfetch中か」を管理し、useCallback の deps から recipes を除く
  const fetchingRef = useRef(false)

  const load = useCallback(async () => {
    // sessionStorage キャッシュ確認
    const cached = getSessionRecipes()
    if (cached) {
      setRecipes(cached)
      return
    }

    // 二重fetchを防ぐ
    if (fetchingRef.current) return
    fetchingRef.current = true

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(RECIPES_URL)
      if (!res.ok) throw new Error(`recipes.json fetch failed: ${res.status}`)
      const data = (await res.json()) as Recipe[]
      setSessionRecipes(data)
      setRecipes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'レシピデータの取得に失敗しました')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])  // deps を空にして安定した関数参照を保持

  return { recipes, loading, error, load }
}

/** 完成品IDでレシピを検索 */
export function findRecipeByResultId(
  recipes: Recipe[],
  resultId: number
): Recipe | undefined {
  return recipes.find((r) => r.result === resultId)
}

/** クラフト可能なアイテムのIDセット */
export function buildCraftableSet(recipes: Recipe[]): Set<number> {
  return new Set(recipes.map((r) => r.result))
}
