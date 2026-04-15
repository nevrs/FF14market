import { useState, useEffect, useMemo } from 'react'
import type { ItemsMap, Recipe } from '../types'
import { SearchInput } from './SearchInput'
import { Spinner } from './Spinner'
import { useMultiplePrices } from '../hooks/usePrice'
import { useRecipes, findRecipeByResultId, buildCraftableSet } from '../hooks/useRecipes'
import { calculateCraftCost, formatGil } from '../utils/calculations'
import { fetchHistory } from '../services/universalis'
import { calculateDailyVolume } from '../utils/calculations'

interface CraftTabProps {
  items: ItemsMap | null
  itemsLoading: boolean
}

export function CraftTab({ items, itemsLoading }: CraftTabProps) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [finishedDailyVolume, setFinishedDailyVolume] = useState<number | null>(null)

  const { recipes, loading: recipesLoading, error: recipesError, load: loadRecipes } = useRecipes()
  const { prices, loading: pricesLoading, error: pricesError, load: loadPrices } = useMultiplePrices()

  useEffect(() => { void loadRecipes() }, [loadRecipes])

  const craftableSet = useMemo(
    () => (recipes ? buildCraftableSet(recipes) : new Set<number>()),
    [recipes]
  )

  async function handleSelect(id: string, name: string) {
    const numId = Number(id)
    setSelectedItemId(numId)
    setSelectedName(name)
    setSelectedRecipe(null)
    setFinishedDailyVolume(null)

    if (!recipes) return
    const recipe = findRecipeByResultId(recipes, numId)
    if (!recipe) return
    setSelectedRecipe(recipe)

    const allIds = [numId, ...recipe.ingredients.map((i) => i.id)]
    void loadPrices(allIds)

    try {
      const hist = await fetchHistory(numId)
      setFinishedDailyVolume(calculateDailyVolume(hist))
    } catch { /* non-critical */ }
  }

  const costResult = useMemo(() => {
    if (!selectedRecipe || prices.size === 0) return null
    return calculateCraftCost(
      selectedRecipe.ingredients,
      prices,
      selectedRecipe.yields ?? 1
    )
  }, [selectedRecipe, prices])

  const finishedItem = selectedItemId ? prices.get(selectedItemId) : null
  const sellNQ = finishedItem ? (finishedItem.minPriceNQ || finishedItem.minPrice || 0) : 0
  const sellHQ = finishedItem ? (finishedItem.minPriceHQ || 0) : 0

  const profitNQmat = costResult && sellNQ ? sellNQ - costResult.totalNQCost : null
  const profitHQmat = costResult && sellNQ ? sellNQ - costResult.totalHQCost : null

  const loading = recipesLoading || pricesLoading
  const error = recipesError || pricesError

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">クラフトアイテム検索</h2>
        {recipesLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Spinner size="sm" />
            <span>レシピデータを読み込み中...</span>
          </div>
        ) : (
          <SearchInput
            items={items}
            itemsLoading={itemsLoading}
            onSelect={handleSelect}
            placeholder="クラフト可能なアイテム名を入力"
            filterIds={craftableSet}
          />
        )}
        {recipes && (
          <p className="mt-1.5 text-xs text-gray-500">
            {craftableSet.size.toLocaleString()} 件のクラフト可能アイテム
          </p>
        )}
      </div>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-400 text-sm">
          エラー: {error}
        </div>
      )}

      {!recipesLoading && pricesLoading && (
        <div className="card flex items-center justify-center gap-3 py-10">
          <Spinner />
          <span className="text-gray-400">価格データを取得中...</span>
        </div>
      )}

      {selectedItemId && !selectedRecipe && !loading && (
        <div className="card text-gray-400 text-sm">
          このアイテムのレシピが見つかりませんでした。
        </div>
      )}

      {!loading && selectedRecipe && costResult && (
        <>
          {/* Header */}
          <div>
            <h2 className="text-base font-bold text-white">{selectedName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedRecipe.yields > 1 ? `× ${selectedRecipe.yields} 個制作` : '× 1 個制作'}
              　1日あたり取引量：{finishedDailyVolume !== null ? `${finishedDailyVolume.toLocaleString()} 個` : '—'}
            </p>
          </div>

          {/* 売値 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="badge-nq">NQ</span>
                <span className="stat-label">完成品 最安値</span>
              </div>
              <span className="stat-value text-yellow-300">{formatGil(sellNQ)}</span>
            </div>
            <div className="card">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="badge-hq">HQ</span>
                <span className="stat-label">完成品 最安値</span>
              </div>
              <span className="stat-value text-yellow-300">{formatGil(sellHQ)}</span>
            </div>
          </div>

          {/* 粗利益サマリー */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              予想粗利益（完成品NQ売値 − 素材コスト / 個）
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ProfitBlock
                label="全NQ素材で制作"
                cost={costResult.totalNQCost}
                profit={profitNQmat}
              />
              <ProfitBlock
                label="全HQ素材で制作"
                cost={costResult.totalHQCost}
                profit={profitHQmat}
              />
            </div>
          </div>

          {/* 素材テーブル */}
          <div className="card overflow-x-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              必要素材
            </h3>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-700">
                  <th className="text-left pb-2 pr-3">素材名</th>
                  <th className="text-right pb-2 pr-3">必要数</th>
                  <th className="text-right pb-2 pr-3">
                    <span className="badge-nq">NQ</span> 単価
                  </th>
                  <th className="text-right pb-2 pr-3">
                    <span className="badge-hq">HQ</span> 単価
                  </th>
                  <th className="text-right pb-2 pr-3">NQ 小計</th>
                  <th className="text-right pb-2">HQ 小計</th>
                </tr>
              </thead>
              <tbody>
                {costResult.breakdown.map((row) => {
                  const name = items?.[row.id]
                  const hasHQ = row.hqUnitPrice > 0 && row.hqUnitPrice !== row.nqUnitPrice
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-2 pr-3">
                        <span className="text-gray-200">{name?.ja || name?.en || `ID:${row.id}`}</span>
                        <span className="block text-xs text-gray-500">{name?.en}</span>
                      </td>
                      <td className="text-right pr-3 text-gray-300">× {row.amount}</td>
                      <td className="text-right pr-3 font-mono text-gray-200">
                        {row.nqUnitPrice > 0 ? row.nqUnitPrice.toLocaleString() : '—'}
                      </td>
                      <td className={`text-right pr-3 font-mono ${hasHQ ? 'text-yellow-300' : 'text-gray-500'}`}>
                        {row.hqUnitPrice > 0 ? row.hqUnitPrice.toLocaleString() : '—'}
                      </td>
                      <td className="text-right pr-3 font-mono text-gray-300">
                        {row.nqSubtotal > 0 ? row.nqSubtotal.toLocaleString() : '—'}
                      </td>
                      <td className={`text-right font-mono ${hasHQ ? 'text-yellow-200' : 'text-gray-500'}`}>
                        {row.hqSubtotal > 0 ? row.hqSubtotal.toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-600 font-semibold text-xs">
                  <td colSpan={4} className="pt-2 text-gray-300">
                    合計コスト（1個あたり）
                    {selectedRecipe.yields > 1 && (
                      <span className="text-gray-500 ml-1">÷ {selectedRecipe.yields}</span>
                    )}
                  </td>
                  <td className="text-right pt-2 font-mono text-red-400">
                    {formatGil(costResult.totalNQCost)}
                  </td>
                  <td className="text-right pt-2 font-mono text-yellow-400">
                    {formatGil(costResult.totalHQCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function ProfitBlock({
  label,
  cost,
  profit,
}: {
  label: string
  cost: number
  profit: number | null
}) {
  const isProfit = profit !== null && profit >= 0
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-400">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-gray-500">コスト</span>
        <span className="font-mono text-red-400 font-semibold">{formatGil(cost)}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-gray-500">粗利益</span>
        <span className={`font-mono font-bold text-lg ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {profit !== null
            ? `${profit >= 0 ? '+' : ''}${Math.round(profit).toLocaleString('ja-JP')} G`
            : '—'}
        </span>
      </div>
    </div>
  )
}
