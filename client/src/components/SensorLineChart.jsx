import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'

const GRANULARITIES = [
  { label: '5 minutes', value: 'minutes5' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
]

const CustomXAxisTick = ({ x, y, payload }) => {
  const [mainLabel, subLabel] = String(payload.value).split('\n')

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={8}
        textAnchor="middle"
        fill="#9CA3AF"
        fontSize={10}
      >
        {mainLabel}
      </text>

      {subLabel && (
        <text
          x={0}
          y={12}
          dy={8}
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize={10}
        >
          {subLabel}
        </text>
      )}
    </g>
  )
}

// data: [{ label: string, value: number | null }]
export function SensorLineChart({
  title,
  unit,
  data = [],
  thresholdMin,
  thresholdMax,
  granularity = 'hours',
  onGranularityChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  maxDate,
  startMaxDate,
  endMinDate,
  endMaxDate,
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative inline-flex items-center">
              <select
                value={granularity}
                onChange={(e) => onGranularityChange?.(e.target.value)}
                className="appearance-none rounded-full border border-border bg-background py-1 pl-3 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {GRANULARITIES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>

            <input
              type="date"
              value={startDate || ''}
              max={startMaxDate || maxDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="rounded-full border border-border bg-background py-1 px-3 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            />

            <span className="text-xs text-muted-foreground">to</span>

            <input
              type="date"
              value={endDate || ''}
              min={endMinDate || startDate || ''}
              max={endMaxDate || maxDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              disabled={granularity === 'minutes5'}
              className="rounded-full border border-border bg-background py-1 px-3 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 16, right: 8, bottom: 14, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              height={38}
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
                ifOverflow="extendDomain"
                label={{ value: `${thresholdMax}${unit}`, position: 'insideTopRight', fontSize: 10, fill: '#EF4444' }}
              />
            )}
            {thresholdMin != null && (
              <ReferenceLine
                y={thresholdMin}
                stroke="#EF4444"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                ifOverflow="extendDomain"
                label={{ value: `${thresholdMin}${unit}`, position: 'insideBottomRight', fontSize: 10, fill: '#EF4444' }}
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