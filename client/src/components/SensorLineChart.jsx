import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'

const TIME_RANGES = [
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
]

// data: [{ label: string, value: number | null }]
export function SensorLineChart({
  title,
  unit,
  data = [],
  thresholdMin,
  thresholdMax,
  timeRange = '7d',
  onTimeRangeChange,
  isAlert = false,
}) {
  const lineColor = isAlert ? '#EF4444' : '#3B82F6'

  const values = data.map((d) => d.value).filter(Number.isFinite)
  const allBoundary = [
    ...values,
    thresholdMin != null ? thresholdMin : null,
    thresholdMax != null ? thresholdMax : null,
  ].filter(Number.isFinite)

  const dataMin = allBoundary.length ? Math.min(...allBoundary) : 0
  const dataMax = allBoundary.length ? Math.max(...allBoundary) : 100
  const pad = (dataMax - dataMin) * 0.15 || 1
  const yDomain = [Math.floor(dataMin - pad), Math.ceil(dataMax + pad)]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="relative inline-flex items-center">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange?.(e.target.value)}
              className="appearance-none rounded-full border border-border bg-background py-1 pl-3 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {TIME_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}${unit}`}
              width={44}
            />
            {thresholdMax != null && (
              <ReferenceLine
                y={thresholdMax}
                stroke="#EF4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: `${thresholdMax}${unit}`, position: 'insideTopLeft', fontSize: 10, fill: '#EF4444', fontWeight: 600 }}
              />
            )}
            {thresholdMin != null && (
              <ReferenceLine
                y={thresholdMin}
                stroke="#EF4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: `${thresholdMin}${unit}`, position: 'insideTopLeft', fontSize: 10, fill: '#EF4444', fontWeight: 600 }}
              />
            )}
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(v) => [v != null ? `${Number(v).toFixed(1)}${unit}` : '—', title]}
              labelStyle={{ color: '#6B7280', marginBottom: 2 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
