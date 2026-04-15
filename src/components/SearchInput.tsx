import { useState, useRef, useEffect } from 'react'
import type { ItemsMap } from '../types'
import { searchItems } from '../hooks/useItems'
import { Spinner } from './Spinner'
import {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
  type HistoryEntry,
} from '../hooks/useSearchHistory'

interface SearchResult {
  id: string
  ja: string
  en: string
}

interface SearchInputProps {
  items: ItemsMap | null
  itemsLoading: boolean
  onSelect: (id: string, name: string) => void
  placeholder?: string
  filterIds?: Set<number>
}

type DropdownMode = 'search' | 'history' | 'closed'

export function SearchInput({
  items,
  itemsLoading,
  onSelect,
  placeholder = 'アイテム名を入力（日本語・英語）',
  filterIds,
}: SearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [mode, setMode] = useState<DropdownMode>('closed')
  const [activeIdx, setActiveIdx] = useState(-1)
  const justSelectedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // クエリが変わったら検索結果を更新
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (!items || !query.trim()) {
      setResults([])
      if (query.trim() === '') {
        // 空欄なら履歴モードへ（フォーカス中のみ — focusイベントで制御）
      } else {
        setMode('closed')
      }
      return
    }
    const raw = searchItems(items, query, 50)
    const filtered = filterIds
      ? raw.filter((r) => filterIds.has(Number(r.id)))
      : raw
    const sliced = filtered.slice(0, 30)
    setResults(sliced)
    setMode(sliced.length > 0 ? 'search' : 'closed')
    setActiveIdx(-1)
  }, [query, items, filterIds])

  // 外側クリックで閉じる
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMode('closed')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleFocus() {
    if (!query.trim()) {
      const h = getSearchHistory()
      if (h.length > 0) {
        setHistory(h)
        setMode('history')
        setActiveIdx(-1)
      }
    }
  }

  const displayList: SearchResult[] =
    mode === 'history'
      ? history.map((h) => ({ id: h.id, ja: h.ja, en: h.en }))
      : results

  function handleKeyDown(e: React.KeyboardEvent) {
    if (mode === 'closed') return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, displayList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      select(displayList[activeIdx])
    } else if (e.key === 'Escape') {
      setMode('closed')
    }
  }

  function select(r: SearchResult) {
    justSelectedRef.current = true
    addSearchHistory({ id: r.id, ja: r.ja, en: r.en })
    onSelect(r.id, r.ja || r.en)
    setQuery(r.ja || r.en)
    setMode('closed')
  }

  function handleClearHistory(e: React.MouseEvent) {
    e.stopPropagation()
    clearSearchHistory()
    setHistory([])
    setMode('closed')
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={itemsLoading ? 'アイテムデータ読み込み中...' : placeholder}
          disabled={itemsLoading}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-sm
                     placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1
                     focus:ring-blue-500 transition-colors disabled:opacity-50"
        />
        {itemsLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </span>
        )}
      </div>

      {mode !== 'closed' && displayList.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg
                        shadow-xl text-sm overflow-hidden">
          {/* 履歴ヘッダー */}
          {mode === 'history' && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 bg-gray-900/50">
              <span className="text-xs text-gray-400">検索履歴</span>
              <button
                onMouseDown={handleClearHistory}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                履歴をクリア
              </button>
            </div>
          )}

          <ul className="max-h-64 overflow-y-auto">
            {displayList.map((r, i) => (
              <li
                key={r.id}
                className={`px-4 py-2 cursor-pointer transition-colors flex justify-between items-center gap-2
                            ${i === activeIdx ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                onMouseDown={() => select(r)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {mode === 'history' && (
                  <span className="text-gray-500 shrink-0 text-xs">🕐</span>
                )}
                <span className="font-medium flex-1 truncate">{r.ja || r.en}</span>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{r.en}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
