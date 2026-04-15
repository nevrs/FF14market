import { useState } from 'react'
import type { ItemsMap } from '../types'
import { SearchInput } from './SearchInput'
import { DailyChart } from './DailyChart'
import { Spinner } from './Spinner'
import { usePrice } from '../hooks/usePrice'
import { formatGil } from '../utils/calculations'

interface PriceTabProps {
  items: ItemsMap | null
  itemsLoading: boolean
}

export function PriceTab({ items, itemsLoading }: PriceTabProps) {
  const [selectedName, setSelectedName] = useState('')
  const { item, dailyStats, dailyVolume, loading, error, load } = usePrice()

  function handleSelect(id: string, name: string) {
    setSelectedName(name)
    void load(Number(id))
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">アイテム検索</h2>
        <SearchInput
          items={items}
          itemsLoading={itemsLoading}
          onSelect={handleSelect}
          placeholder="アイテム名を入力（日本語・英語）"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="card flex items-center justify-center gap-3 py-10">
          <Spinner />
          <span className="text-gray-400">価格データを取得中...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-400 text-sm">
          エラー: {error}
        </div>
      )}

      {/* Results */}
      {!loading && item && (
        <>
          <h2 className="text-base font-bold text-white px-1">{selectedName}</h2>

          {/* Stats grid — 4カード */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="現在最安値" quality="NQ" value={formatGil(item.minPriceNQ || item.minPrice)} />
            <StatCard label="現在最安値" quality="HQ" value={formatGil(item.minPriceHQ)} />
            <StatCard label="平均価格"   quality="NQ" value={formatGil(item.averagePriceNQ || item.averagePrice)} />
            <StatCard label="平均価格"   quality="HQ" value={formatGil(item.averagePriceHQ)} />
          </div>

          {/* Daily volume */}
          <div className="card flex items-center justify-between">
            <span className="stat-label">1日あたり取引量</span>
            <span className="text-lg font-semibold text-white">
              {dailyVolume > 0 ? `${dailyVolume.toLocaleString()} 個` : '—'}
            </span>
          </div>

          {/* Daily chart */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              過去7日 日別価格推移
            </h3>
            <DailyChart data={dailyStats} />
          </div>

          {/* Listing table */}
          {item.listings && item.listings.length > 0 && (
            <div className="card overflow-x-auto">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                現在の出品一覧（最安値順）
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b border-gray-700">
                    <th className="text-left pb-2 pr-4">品質</th>
                    <th className="text-right pb-2 pr-4">単価</th>
                    <th className="text-right pb-2 pr-4">数量</th>
                    <th className="text-right pb-2">合計</th>
                  </tr>
                </thead>
                <tbody>
                  {item.listings
                    .slice()
                    .sort((a, b) => a.pricePerUnit - b.pricePerUnit)
                    .slice(0, 15)
                    .map((listing, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-1.5 pr-4">
                          {listing.hq ? (
                            <span className="badge-hq">HQ</span>
                          ) : (
                            <span className="badge-nq">NQ</span>
                          )}
                        </td>
                        <td className="text-right pr-4 font-mono text-yellow-300">
                          {listing.pricePerUnit.toLocaleString()}
                        </td>
                        <td className="text-right pr-4 text-gray-300">
                          {listing.quantity.toLocaleString()}
                        </td>
                        <td className="text-right text-gray-300">
                          {(listing.pricePerUnit * listing.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  quality,
  value,
}: {
  label: string
  quality: 'NQ' | 'HQ'
  value: string
}) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {quality === 'NQ' ? (
          <span className="badge-nq">NQ</span>
        ) : (
          <span className="badge-hq">HQ</span>
        )}
        <span className="stat-label">{label}</span>
      </div>
      <span className="stat-value text-yellow-300">{value}</span>
    </div>
  )
}
