import { AngleMode } from '../../hooks/useCalculator'

interface DisplayProps {
  expression: string
  result: string
  isShift: boolean
  angleMode: AngleMode
  isGraphMode: boolean
  hasError: boolean
}

export default function Display({ expression, result, isShift, angleMode, isGraphMode, hasError }: DisplayProps) {
  const displayExpr = expression || '0'

  return (
    <div style={{
      background: '#0a0c10',
      borderRadius: '10px',
      border: '2px solid #1e2028',
      boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.02)',
      padding: '14px 16px 12px',
      minHeight: '120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents: 'none',
        borderRadius: '10px',
      }} />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <Indicator label={angleMode} active />
        <Indicator label="SHIFT" active={isShift} color="#f59e0b" />
        <div style={{ flex: 1 }} />
        {isGraphMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(34,211,238,0.1)',
            border: '1px solid rgba(34,211,238,0.3)',
            borderRadius: '4px',
            padding: '1px 6px',
            animation: 'pulse-badge 2s ease-in-out infinite',
          }}>
            <span style={{ color: '#22d3ee', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              GRAPH
            </span>
          </div>
        )}
      </div>

      <div style={{
        color: hasError ? '#f43f5e' : '#e2e8f0',
        fontSize: displayExpr.length > 18 ? '1.2rem' : displayExpr.length > 12 ? '1.6rem' : '2rem',
        fontWeight: 300,
        letterSpacing: '-0.03em',
        textAlign: 'right',
        lineHeight: 1.1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontFamily: "'Inter', monospace",
        transition: 'font-size 0.1s',
      }}>
        {displayExpr}
        {!hasError && !result && (
          <span style={{
            display: 'inline-block',
            width: '2px',
            height: '1.1em',
            background: '#6366f1',
            marginLeft: '2px',
            verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
          }} />
        )}
      </div>

      <div style={{
        color: hasError ? '#f43f5e88' : (isGraphMode ? '#22d3ee' : '#6366f1'),
        fontSize: '0.85rem',
        fontWeight: 400,
        textAlign: 'right',
        marginTop: '6px',
        minHeight: '18px',
        letterSpacing: '0.01em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {result || (isGraphMode ? 'f(x) — press PLOT to graph' : '')}
      </div>

      <style>{`
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

function Indicator({ label, active, color = '#6366f1' }: { label: string; active: boolean; color?: string }) {
  return (
    <span style={{
      fontSize: '0.6rem',
      fontWeight: 600,
      letterSpacing: '0.06em',
      color: active ? color : '#2a2d35',
      transition: 'color 0.15s',
      userSelect: 'none',
    }}>
      {label}
    </span>
  )
}
