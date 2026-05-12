import { useEffect, useCallback, useState, useRef } from 'react'
import { useCalculator } from '../../hooks/useCalculator'
import { isGraphExpression } from '../../utils/parser'
import { importFromText } from '../../utils/expressionNormalizer'
import Display from './Display'
import Keypad from './Keypad'
import History from './History'
import GraphOverlay from '../Graph/GraphOverlay'

export default function Calculator() {
  const { expression, result, isShift, angleMode, history, hasError, isGraphMode, dispatch } = useCalculator()
  const [graphOpen, setGraphOpen] = useState(false)

  const [showShortcuts, setShowShortcuts] = useState(false)
  const shortcutsCardRef = useRef<HTMLDivElement>(null)
  const shortcutsToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        shortcutsCardRef.current?.contains(e.target as Node) ||
        shortcutsToggleRef.current?.contains(e.target as Node)
      ) return
      setShowShortcuts(false)
    }
    if (showShortcuts) {
      document.addEventListener('mousedown', onOutside)
      return () => document.removeEventListener('mousedown', onOutside)
    }
  }, [showShortcuts])

  const [showImport, setShowImport] = useState(false)
  const [importInput, setImportInput] = useState('')
  const importPanelRef = useRef<HTMLDivElement>(null)
  const importToggleRef = useRef<HTMLButtonElement>(null)
  const importTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        importPanelRef.current?.contains(e.target as Node) ||
        importToggleRef.current?.contains(e.target as Node)
      ) return
      setShowImport(false)
    }
    if (showImport) {
      document.addEventListener('mousedown', onOutside)
      return () => document.removeEventListener('mousedown', onOutside)
    }
  }, [showImport])

  useEffect(() => {
    if (showImport) setTimeout(() => importTextareaRef.current?.focus(), 60)
  }, [showImport])

  interface ImportToast { expr: string; warnings: string[] }
  const [importToast, setImportToast] = useState<ImportToast | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(toast: ImportToast) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setImportToast(toast)
    toastTimerRef.current = setTimeout(() => setImportToast(null), 4000)
  }

  function handleImportSubmit() {
    const text = importInput.trim()
    if (!text) return

    const imported = importFromText(text)
    setShowImport(false)
    setImportInput('')

    if (!imported.ok) {
      showToast({ expr: imported.error, warnings: [] })
      return
    }

    const { expr, warnings } = imported.result
    dispatch({ type: 'LOAD', expression: expr })
    showToast({ expr, warnings })

    if (isGraphExpression(expr)) {
      setGraphOpen(true)
    } else {
      // EQUALS must fire after LOAD has been processed by React
      setTimeout(() => dispatch({ type: 'EQUALS' }), 0)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) return

    if (e.key >= '0' && e.key <= '9') {
      dispatch({ type: 'APPEND', value: e.key })
    } else if (e.key === '+') {
      dispatch({ type: 'APPEND', value: '+' })
    } else if (e.key === '-') {
      dispatch({ type: 'APPEND', value: '-' })
    } else if (e.key === '*') {
      dispatch({ type: 'APPEND', value: '*' })
    } else if (e.key === '/' && !e.ctrlKey) {
      e.preventDefault()
      dispatch({ type: 'APPEND', value: '/' })
    } else if (e.key === '.') {
      dispatch({ type: 'APPEND', value: '.' })
    } else if (e.key === '(') {
      dispatch({ type: 'APPEND', value: '(' })
    } else if (e.key === ')') {
      dispatch({ type: 'APPEND', value: ')' })
    } else if (e.key === '^') {
      dispatch({ type: 'APPEND', value: '^' })
    } else if (e.key === 'x' || e.key === 'X') {
      dispatch({ type: 'APPEND', value: 'x' })
    } else if (e.key === 'Enter' || e.key === '=') {
      if (isGraphMode) setGraphOpen(true)
      else dispatch({ type: 'EQUALS' })
    } else if (e.key === 'Backspace') {
      dispatch({ type: 'BACKSPACE' })
    } else if (e.key === 'Escape') {
      if (graphOpen) setGraphOpen(false)
      else dispatch({ type: 'CLEAR' })
    }
  }, [dispatch, isGraphMode, graphOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handlePlotted(expr: string) {
    dispatch({ type: 'ADD_GRAPH_HISTORY', expression: expr })
  }

  return (
    <>
      <div style={{
        background: 'linear-gradient(180deg, #1e2128 0%, #191c23 100%)',
        borderRadius: '24px',
        border: '1px solid #2a2d38',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '20px 18px 24px',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        position: 'relative',
      }}>

        {/* Brand strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>
            FX-GRAPH
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              ref={importToggleRef}
              onClick={() => { setShowImport(s => !s); setShowShortcuts(false) }}
              title="Import / paste expression"
              style={{
                background: 'transparent', border: 'none',
                color: showImport ? '#22d3ee' : '#475569',
                cursor: 'pointer', fontSize: '0.88rem',
                lineHeight: 1, padding: '0 2px', transition: 'color 0.15s',
              }}
            >
              ⬆
            </button>
            <button
              ref={shortcutsToggleRef}
              onClick={() => { setShowShortcuts(s => !s); setShowImport(false) }}
              title="Keyboard shortcuts"
              style={{
                background: 'transparent', border: 'none',
                color: showShortcuts ? '#6366f1' : '#475569',
                cursor: 'pointer', fontSize: '0.9rem',
                lineHeight: 1, padding: '0 2px', transition: 'color 0.15s',
              }}
            >
              ⌨
            </button>
          </div>

          <span style={{ color: '#22d3ee', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.7 }}>
            SCIENTIFIC
          </span>
        </div>

        {showImport && (
          <div ref={importPanelRef} style={{
            position: 'absolute',
            top: '52px', left: '18px', right: '18px',
            background: '#0f1015',
            border: '1px solid #2a2d38',
            borderRadius: '12px',
            padding: '14px 16px',
            zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}>
            <div style={{
              color: '#64748b', fontSize: '0.62rem', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              marginBottom: '10px', fontFamily: "'Inter', sans-serif",
            }}>
              Enter Expression
            </div>

            <textarea
              ref={importTextareaRef}
              value={importInput}
              onChange={e => setImportInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleImportSubmit() }
                if (e.key === 'Escape') setShowImport(false)
              }}
              placeholder={'sin(x)^2 + cos(x)^2\narcsin(x) + ln(x)\n2x² − 3x + 1'}
              rows={3}
              style={{
                width: '100%',
                background: '#0a0c10',
                border: '1px solid #2a2d38',
                borderRadius: '8px',
                padding: '9px 11px',
                color: '#f1f5f9',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.85rem',
                lineHeight: 1.55,
                outline: 'none',
                resize: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2d38')}
            />

            <div style={{
              color: '#334155', fontSize: '0.63rem',
              fontFamily: "'Inter', sans-serif",
              margin: '7px 0 10px',
              lineHeight: 1.5,
            }}>
              Understands: arcsin · ln · lg · tg · ctg · π · × · ÷ · √ · x² · implicit × (2x) · f(x)= prefix · Enter to submit
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowImport(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2a2d38',
                  borderRadius: '7px',
                  color: '#475569',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importInput.trim()}
                style={{
                  background: importInput.trim() ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '7px',
                  color: importInput.trim() ? '#818cf8' : '#2a2d38',
                  padding: '6px 18px',
                  cursor: importInput.trim() ? 'pointer' : 'default',
                  fontSize: '0.78rem',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                Calculate →
              </button>
            </div>
          </div>
        )}

        {showShortcuts && (
          <div ref={shortcutsCardRef} style={{
            position: 'absolute',
            top: '52px', left: '18px', right: '18px',
            background: '#0f1015',
            border: '1px solid #2a2d38',
            borderRadius: '12px',
            padding: '12px 16px 14px',
            zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.75)',
          }}>
            <div style={{
              color: '#64748b', fontSize: '0.62rem', fontWeight: 700,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              marginBottom: '10px', fontFamily: "'Inter', sans-serif",
            }}>
              Keyboard Shortcuts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {([
                ['0 – 9', 'Digits'],
                ['+ − × ÷', 'Operators  ( + - * / )'],
                ['.', 'Decimal point'],
                ['x', 'Variable x'],
                ['^', 'Power'],
                ['( )', 'Parentheses'],
                ['Enter / =', 'Evaluate or plot'],
                ['Backspace', 'Delete last character'],
                ['Escape', 'Clear / close graph'],
              ] as [string, string][]).map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span style={{
                    color: '#e2e8f0', fontFamily: "'Courier New', monospace",
                    fontSize: '0.75rem', fontWeight: 600,
                    minWidth: '72px', flexShrink: 0,
                  }}>
                    {key}
                  </span>
                  <span style={{ color: '#475569', fontSize: '0.72rem', fontFamily: "'Inter', sans-serif" }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          background: '#111318',
          borderRadius: '14px',
          padding: '4px',
          border: '1px solid #1e2028',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
          marginBottom: '16px',
        }}>
          <Display
            expression={expression}
            result={result}
            isShift={isShift}
            angleMode={angleMode}
            isGraphMode={isGraphMode}
            hasError={hasError}
          />
        </div>

        {importToast && (
          <div className="toast-enter" style={{
            marginBottom: '8px',
            background: '#0f1015',
            border: `1px solid ${importToast.warnings.length > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(34,211,238,0.3)'}`,
            borderRadius: '10px',
            padding: '8px 10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                color: importToast.warnings.length > 0 ? '#f59e0b' : '#22d3ee',
                fontSize: '0.72rem', flexShrink: 0,
              }}>
                ✓
              </span>
              <span style={{
                color: '#e2e8f0', fontFamily: "'Courier New', monospace",
                fontSize: '0.78rem', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {importToast.expr}
              </span>
              <button
                onClick={() => setImportToast(null)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#475569', cursor: 'pointer',
                  fontSize: '0.85rem', lineHeight: 1, padding: '0 2px', flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
            {importToast.warnings.length > 0 && (
              <div style={{
                color: '#f59e0b', fontSize: '0.67rem',
                fontFamily: "'Inter', sans-serif",
                marginTop: '4px', paddingLeft: '18px',
              }}>
                {importToast.warnings.join(' · ')}
              </div>
            )}
          </div>
        )}

        <History
          history={history}
          onLoad={expr => dispatch({ type: 'LOAD', expression: expr })}
          onClear={() => dispatch({ type: 'CLEAR_HISTORY' })}
        />

        <div style={{
          background: '#141720',
          borderRadius: '14px',
          padding: '14px 10px',
          border: '1px solid #1a1d26',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
        }}>
          <Keypad
            dispatch={dispatch}
            isShift={isShift}
            angleMode={angleMode}
            isGraphMode={isGraphMode}
            onPlot={() => setGraphOpen(true)}
          />
        </div>
      </div>

      <GraphOverlay
        expression={expression}
        angleMode={angleMode}
        isOpen={graphOpen}
        onClose={() => setGraphOpen(false)}
        onPlotted={handlePlotted}
      />
    </>
  )
}
