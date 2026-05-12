import { useState } from 'react'
import { HistoryEntry } from '../../hooks/useCalculator'

interface HistoryProps {
  history: HistoryEntry[]
  onLoad: (expression: string) => void
  onClear: () => void
}

export default function History({ history, onLoad, onClear }: HistoryProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* position:relative so the Clear button can float absolutely without shifting the toggle */}
      <div style={{ position: 'relative', padding: '6px 4px' }}>
        <div
          role="button"
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: '#64748b',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif",
            userSelect: 'none',
          }}
        >
          {/* Slides right when open to make room for the Clear button */}
          <span style={{
            paddingLeft: open ? '42px' : '0',
            transition: 'padding-left 0.2s ease',
          }}>
            History ({Math.min(history.length, 5)})
          </span>
          <span style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            fontSize: '0.8rem',
          }}>
            ▾
          </span>
        </div>

        {/* Fades in when open so it doesn't affect the toggle's layout */}
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            left: '4px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '5px',
            color: '#475569',
            fontSize: '0.65rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: '0.04em',
            padding: '2px 6px',
            cursor: 'pointer',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 0.2s, color 0.15s, border-color 0.15s, background 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f43f5e'
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'
            e.currentTarget.style.background = 'rgba(244,63,94,0.07)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#475569'
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{
        maxHeight: open ? '200px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.25s ease',
      }}>
        <div style={{
          background: '#0f1015',
          border: '1px solid #1e2028',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {history.slice(0, 5).map((entry, i) => (
            <div
              key={entry.id}
              className="history-item-enter"
              onClick={() => onLoad(entry.isGraph ? entry.expression : entry.result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderBottom: i < Math.min(history.length, 5) - 1 ? '1px solid #1a1c22' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
                animationDelay: `${i * 0.04}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#161820'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.7, flexShrink: 0 }}>
                {entry.isGraph ? '📈' : '='}
              </span>
              <span style={{
                color: '#94a3b8',
                fontSize: '0.78rem',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {entry.expression}
              </span>
              {!entry.isGraph && (
                <span style={{
                  color: '#6366f1',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  flexShrink: 0,
                }}>
                  {entry.result}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
