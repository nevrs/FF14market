import { useState } from 'react'
import { useItems } from './hooks/useItems'
import { PriceTab } from './components/PriceTab'
import { CraftTab } from './components/CraftTab'
import { Spinner } from './components/Spinner'

type TabId = 'price' | 'craft'

const TABS: { id: TabId; label: string }[] = [
  { id: 'price', label: '素材価格' },
  { id: 'craft', label: 'クラフト収益' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('price')
  const { items, loading: itemsLoading, error: itemsError } = useItems()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-400">⚔</span>
            <h1 className="text-lg font-bold text-white tracking-tight">
              FF14 マーケット チェッカー
            </h1>
            <span className="text-xs text-gray-500 hidden sm:inline">Meteor DC</span>
          </div>
          {itemsLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Spinner size="sm" />
              <span className="hidden sm:inline">アイテムDB読込中...</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Items load error banner */}
      {itemsError && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="card border-red-800 bg-red-900/20 text-red-400 text-sm">
            アイテムデータの取得に失敗しました: {itemsError}
          </div>
        </div>
      )}

      {/* Items loading skeleton */}
      {itemsLoading && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="card animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-48 mb-3" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        </div>
      )}

      {/* Main content — 両タブを常時マウントし CSS で切り替え（状態を保持するため） */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className={activeTab === 'price' ? '' : 'hidden'}>
          <PriceTab items={items} itemsLoading={itemsLoading} />
        </div>
        <div className={activeTab === 'craft' ? '' : 'hidden'}>
          <CraftTab items={items} itemsLoading={itemsLoading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-gray-600 space-y-1">
        <div>
          価格データ: <a href="https://universalis.app" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">Universalis</a>
          　アイテムDB: <a href="https://ffxivteamcraft.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 underline">FFXIV Teamcraft</a>
        </div>
        <div className="text-gray-700">v0.3.0 — 2026-04-17</div>
      </footer>
    </div>
  )
}
