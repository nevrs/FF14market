const HISTORY_KEY = 'ff14_search_history_v1'
const MAX_HISTORY = 10

export interface HistoryEntry {
  id: string
  ja: string
  en: string
}

function read(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function write(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
  } catch { /* quota exceeded */ }
}

export function getSearchHistory(): HistoryEntry[] {
  return read()
}

export function addSearchHistory(item: HistoryEntry): void {
  const prev = read().filter((h) => h.id !== item.id)
  write([item, ...prev].slice(0, MAX_HISTORY))
}

export function clearSearchHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}
