import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DailyStat } from '../types'

interface DailyChartProps {
  data: DailyStat[]
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatK(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

export function DailyChart({ data }: DailyChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        履歴データなし
      </div>
    )
  }

  const chartData = data.map((d) => ({
    date: shortDate(d.date),
    安値: d.low,
    高値: d.high,
    取引量: d.volume,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <YAxis
          yAxisId="price"
          tickFormatter={formatK}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          width={52}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          tickFormatter={formatK}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          width={40}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
          labelStyle={{ color: '#e5e7eb' }}
          formatter={(value: number, name: string) => {
            if (name === '取引量') return [value.toLocaleString(), name]
            return [value.toLocaleString() + ' G', name]
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
        <Bar yAxisId="volume" dataKey="取引量" fill="#4b5563" opacity={0.6} />
        <Line yAxisId="price" type="monotone" dataKey="安値" stroke="#60a5fa" dot={false} strokeWidth={2} />
        <Line yAxisId="price" type="monotone" dataKey="高値" stroke="#f87171" dot={false} strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
