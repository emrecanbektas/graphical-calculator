import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts'
import { DataPoint } from '../../utils/graphUtils'
import type { AngleMode } from '../../utils/parser'
import type { Singularity } from '../../utils/domainAnalysis'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: DataPoint }>
}

function CurveTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const pt = payload[0]
  if (!pt) return null
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px',
      padding: '8px 12px', fontSize: '0.8rem', color: '#f1f5f9',
    }}>
      <div style={{ color: '#64748b' }}>x = {Number(pt.payload.x).toFixed(4)}</div>
      <div style={{ color: '#22d3ee' }}>
        y = {pt.value != null ? Number(pt.value).toFixed(6) : 'undefined'}
      </div>
    </div>
  )
}

interface SingLabelProps {
  // Recharts passes viewBox for a vertical ReferenceLine as { x, y, width, height }
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  shortLabel: string
  type: 'asymptote' | 'boundary'
}

function SingularityLabel({ viewBox, shortLabel, type }: SingLabelProps) {
  const lx = viewBox?.x ?? 0
  const ly = viewBox?.y ?? 0
  const fill = type === 'asymptote' ? '#f43f5e' : '#f59e0b'
  const bg   = type === 'asymptote' ? 'rgba(244,63,94,0.12)' : 'rgba(245,158,11,0.12)'

  return (
    <g>
      <rect
        x={lx - 18} y={ly + 4}
        width={36} height={14}
        rx={3} fill={bg}
        stroke={fill} strokeWidth={0.5} strokeOpacity={0.6}
      />
      <text
        x={lx} y={ly + 14}
        textAnchor="middle"
        fill={fill}
        fontSize={9}
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        opacity={0.9}
      >
        {shortLabel}
      </text>
    </g>
  )
}

function PulsingDot({ cx = 0, cy = 0, evalX, evalY, angleMode }: {
  cx?: number; cy?: number
  evalX: number; evalY: number; angleMode: AngleMode
}) {
  const xStr = parseFloat(evalX.toFixed(3)).toString() + (angleMode === 'DEG' ? '°' : '')
  const yStr = parseFloat(evalY.toFixed(4)).toString()
  const label = `(${xStr},  ${yStr})`
  const labelW = label.length * 6.3 + 14

  return (
    <g>
      <circle cx={cx} cy={cy} fill="none" stroke="#22d3ee" strokeWidth={1.5}>
        <animate attributeName="r"       values="6;20"  dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.65;0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={7} fill="rgba(34,211,238,0.12)" />
      <circle cx={cx} cy={cy} r={4.5} fill="#22d3ee" stroke="#0a0c10" strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,1))' }} />
      <rect x={cx + 12} y={cy - 19} width={labelW} height={18} rx={4}
        fill="#1a1c22" stroke="rgba(34,211,238,0.45)" strokeWidth={1} />
      <text x={cx + 18} y={cy - 6} fill="#22d3ee" fontSize={10}
        fontFamily="'Courier New', monospace" fontWeight="600">
        {label}
      </text>
    </g>
  )
}

export interface EvalPoint { x: number; y: number }

interface AnimatedGraphProps {
  visiblePoints: DataPoint[]
  yDomain: [number, number]
  hasData: boolean
  evalPoint?: EvalPoint | null
  angleMode?: AngleMode
  singularities?: Singularity[]
}

export default function AnimatedGraph({
  visiblePoints,
  yDomain,
  hasData,
  evalPoint = null,
  angleMode = 'RAD',
  singularities = [],
}: AnimatedGraphProps) {
  const showEval = evalPoint !== null
  const hasSingularities = singularities.length > 0

  return (
    <div
      className={hasData ? 'graph-fade-in' : ''}
      style={{
        width: '100%',
        height: '340px',
        opacity: hasData ? 1 : 0.15,
        transition: 'opacity 0.5s ease',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={visiblePoints}
          margin={{ top: hasSingularities ? 24 : 10, right: showEval ? 90 : 20, left: 0, bottom: 10 }}
        >
          <defs>
            <linearGradient id="graphGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1e1e1e" strokeDasharray="3 3" />

          <XAxis
            dataKey="x" type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a2a' }} tickLine={{ stroke: '#2a2a2a' }}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a2a' }} tickLine={{ stroke: '#2a2a2a' }}
            width={45}
          />

          <Tooltip content={<CurveTooltip />} />

          <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
          <ReferenceLine x={0} stroke="#333333" strokeWidth={1} />

          {singularities.map((s, i) => {
            const isAsymptote = s.type === 'asymptote'
            const stroke = isAsymptote ? 'rgba(244,63,94,0.55)' : 'rgba(245,158,11,0.55)'
            return (
              <ReferenceLine
                key={`sing-${i}`}
                x={s.x}
                stroke={stroke}
                strokeDasharray={isAsymptote ? '4 3' : '6 3'}
                strokeWidth={1.5}
                label={{
                  content: (
                    <SingularityLabel
                      shortLabel={s.shortLabel}
                      type={s.type}
                    />
                  ),
                }}
              />
            )
          })}

          {showEval && (
            <ReferenceLine
              x={evalPoint!.x}
              stroke="rgba(34,211,238,0.3)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />
          )}
          {showEval && (
            <ReferenceLine
              y={evalPoint!.y}
              stroke="rgba(34,211,238,0.3)"
              strokeDasharray="5 4"
              strokeWidth={1.5}
            />
          )}

          <Line
            type="monotone" dataKey="y"
            stroke="#22d3ee" strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#22d3ee', stroke: '#0f0f0f', strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
            style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.6))' }}
          />

          {showEval && (
            <ReferenceDot
              x={evalPoint!.x}
              y={evalPoint!.y}
              r={0}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              shape={(props: any) => (
                <PulsingDot
                  cx={props.cx} cy={props.cy}
                  evalX={evalPoint!.x} evalY={evalPoint!.y}
                  angleMode={angleMode}
                />
              )}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
