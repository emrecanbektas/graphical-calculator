import React from 'react'
import { AngleMode } from '../../hooks/useCalculator'

type Dispatch = React.Dispatch<{ type: string; value?: string; expression?: string }>

interface KeypadProps {
  dispatch: Dispatch
  isShift: boolean
  angleMode: AngleMode
  isGraphMode: boolean
  onPlot: () => void
}

type BtnVariant = 'num' | 'op' | 'sci' | 'mode' | 'equals' | 'plot' | 'clear' | 'action'

interface BtnProps {
  label: React.ReactNode
  shiftLabel?: React.ReactNode
  onClick: () => void
  variant?: BtnVariant
  isShift?: boolean
  disabled?: boolean
  wide?: boolean
}

const VARIANT_STYLES: Record<BtnVariant, React.CSSProperties> = {
  num: {
    background: '#242830',
    borderBottom: '3px solid #16181e',
    color: '#e2e8f0',
  },
  op: {
    background: 'rgba(99,102,241,0.12)',
    borderBottom: '3px solid rgba(99,102,241,0.25)',
    color: '#818cf8',
  },
  sci: {
    background: '#1c1f26',
    borderBottom: '3px solid #12141a',
    color: '#94a3b8',
    fontSize: '0.78rem',
  },
  mode: {
    background: '#1a1c22',
    borderBottom: '3px solid #0f1014',
    color: '#64748b',
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
  },
  equals: {
    background: 'linear-gradient(160deg, #6366f1 0%, #818cf8 100%)',
    borderBottom: '3px solid #4f46e5',
    color: '#fff',
    fontWeight: 700,
  },
  plot: {
    background: 'rgba(34,211,238,0.1)',
    borderBottom: '3px solid rgba(34,211,238,0.3)',
    color: '#22d3ee',
    fontWeight: 700,
  },
  clear: {
    background: 'rgba(244,63,94,0.1)',
    borderBottom: '3px solid rgba(244,63,94,0.25)',
    color: '#f43f5e',
  },
  action: {
    background: '#1c1f26',
    borderBottom: '3px solid #12141a',
    color: '#94a3b8',
  },
}

function Btn({ label, shiftLabel, onClick, variant = 'num', isShift = false, disabled = false, wide = false }: BtnProps) {
  const [pressed, setPressed] = React.useState(false)

  const base = VARIANT_STYLES[variant]
  const showShift = isShift && shiftLabel !== undefined

  const glowColor =
    variant === 'equals' ? 'rgba(99,102,241,0.5)' :
    variant === 'plot' ? 'rgba(34,211,238,0.5)' :
    variant === 'op' ? 'rgba(99,102,241,0.3)' :
    variant === 'clear' ? 'rgba(244,63,94,0.3)' :
    'rgba(255,255,255,0.06)'

  return (
    <button
      onClick={() => { if (!disabled) onClick() }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      style={{
        ...base,
        gridColumn: wide ? 'span 2' : undefined,
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: '9px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'Inter', sans-serif",
        fontSize: (base.fontSize as string) ?? '0.9rem',
        fontWeight: (base.fontWeight as number) ?? 500,
        height: '44px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1px',
        userSelect: 'none',
        opacity: disabled ? 0.3 : 1,
        transform: pressed ? 'translateY(2px)' : 'translateY(0)',
        boxShadow: pressed
          ? 'none'
          : `0 0 0 0 transparent`,
        transition: 'transform 0.06s, box-shadow 0.12s, opacity 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 10px ${glowColor}`
          e.currentTarget.style.filter = 'brightness(1.15)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.filter = 'none'
      }}
    >
      {shiftLabel && (
        <span style={{
          fontSize: '0.55rem',
          color: showShift ? '#f59e0b' : '#2e3440',
          fontWeight: 600,
          letterSpacing: '0.02em',
          lineHeight: 1,
          transition: 'color 0.15s',
          position: 'absolute',
          top: '4px',
          left: 0,
          right: 0,
          textAlign: 'center',
        }}>
          {shiftLabel}
        </span>
      )}
      <span style={{
        color: showShift && shiftLabel ? '#f59e0b' : (base.color as string),
        transition: 'color 0.15s',
        fontWeight: 'inherit',
      }}>
        {showShift && shiftLabel ? shiftLabel : label}
      </span>
    </button>
  )
}

function Row({ cols, children, gap = 5 }: { cols: number; children: React.ReactNode; gap?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: `${gap}px`,
    }}>
      {children}
    </div>
  )
}

export default function Keypad({ dispatch, isShift, angleMode, isGraphMode, onPlot }: KeypadProps) {
  const app = (value: string) => dispatch({ type: 'APPEND', value })
  const sh = isShift

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

      {/* Row 1: mode & state */}
      <Row cols={5}>
        <Btn
          label={angleMode}
          variant="mode"
          onClick={() => dispatch({ type: 'TOGGLE_ANGLE' })}
          isShift={false}
        />
        <Btn
          label={<span style={{ color: sh ? '#f59e0b' : undefined }}>SHIFT</span>}
          variant={sh ? 'sci' : 'mode'}
          isShift={false}
          onClick={() => dispatch({ type: 'TOGGLE_SHIFT' })}
        />
        <Btn label="MODE" variant="mode" isShift={false} onClick={() => {}} />
        <Btn label="(" variant="action" isShift={false} onClick={() => app('(')} />
        <Btn label=")" variant="action" isShift={false} onClick={() => app(')')} />
      </Row>

      {/* Row 2: powers & roots */}
      <Row cols={5}>
        <Btn label="x²"  shiftLabel="√"   variant="sci" isShift={sh}
          onClick={() => app(sh ? 'sqrt(' : '^2')} />
        <Btn label="x³"  shiftLabel="∛"   variant="sci" isShift={sh}
          onClick={() => app(sh ? 'cbrt(' : '^3')} />
        <Btn label="xʸ"  shiftLabel="ʸ√x" variant="sci" isShift={sh}
          onClick={() => app(sh ? '^(1/' : '^(')} />
        <Btn label="√"   shiftLabel="x²"  variant="sci" isShift={sh}
          onClick={() => app(sh ? '^2' : 'sqrt(')} />
        <Btn label="∛"   shiftLabel="x³"  variant="sci" isShift={sh}
          onClick={() => app(sh ? '^3' : 'cbrt(')} />
      </Row>

      {/* Row 3: log & exp */}
      <Row cols={5}>
        <Btn label="log"  shiftLabel="10ˣ" variant="sci" isShift={sh}
          onClick={() => app(sh ? '10^(' : 'log10(')} />
        <Btn label="ln"   shiftLabel="eˣ"  variant="sci" isShift={sh}
          onClick={() => app(sh ? 'e^(' : 'log(')} />
        <Btn label="eˣ"   shiftLabel="ln"  variant="sci" isShift={sh}
          onClick={() => app(sh ? 'log(' : 'e^(')} />
        <Btn label="10ˣ"  shiftLabel="log" variant="sci" isShift={sh}
          onClick={() => app(sh ? 'log10(' : '10^(')} />
        <Btn label="|x|"  shiftLabel="n!"  variant="sci" isShift={sh}
          onClick={() => app(sh ? 'factorial(' : 'abs(')} />
      </Row>

      {/* Row 4: trig — SHIFT swaps normal / inverse */}
      <Row cols={6}>
        <Btn label="sin"    shiftLabel="sin⁻¹" variant="sci" isShift={sh}
          onClick={() => app(sh ? 'asin(' : 'sin(')} />
        <Btn label="cos"    shiftLabel="cos⁻¹" variant="sci" isShift={sh}
          onClick={() => app(sh ? 'acos(' : 'cos(')} />
        <Btn label="tan"    shiftLabel="tan⁻¹" variant="sci" isShift={sh}
          onClick={() => app(sh ? 'atan(' : 'tan(')} />
        <Btn label="sin⁻¹"  shiftLabel="sin"   variant="sci" isShift={sh}
          onClick={() => app(sh ? 'sin(' : 'asin(')} />
        <Btn label="cos⁻¹"  shiftLabel="cos"   variant="sci" isShift={sh}
          onClick={() => app(sh ? 'cos(' : 'acos(')} />
        <Btn label="tan⁻¹"  shiftLabel="tan"   variant="sci" isShift={sh}
          onClick={() => app(sh ? 'tan(' : 'atan(')} />
      </Row>

      {/* Row 5: variables & constants */}
      <Row cols={5}>
        <Btn label="x"  variant="sci" isShift={false} onClick={() => app('x')} />
        <Btn label="π"  variant="sci" isShift={false} onClick={() => app('pi')} />
        <Btn label="e"  variant="sci" isShift={false} onClick={() => app('e')} />
        <Btn label="ANS" variant="sci" isShift={false} onClick={() => app('ANS')} />
        <Btn label="," variant="action" isShift={false} onClick={() => app(',')} />
      </Row>

      {/* Separator */}
      <div style={{ height: '3px', background: '#12141a', borderRadius: '2px', margin: '2px 0' }} />

      {/* Rows 6–9: number pad + operators */}
      <Row cols={4}>
        <Btn label="7" variant="num" isShift={false} onClick={() => app('7')} />
        <Btn label="8" variant="num" isShift={false} onClick={() => app('8')} />
        <Btn label="9" variant="num" isShift={false} onClick={() => app('9')} />
        <Btn label="÷" variant="op"  isShift={false} onClick={() => app('/')} />
      </Row>
      <Row cols={4}>
        <Btn label="4" variant="num" isShift={false} onClick={() => app('4')} />
        <Btn label="5" variant="num" isShift={false} onClick={() => app('5')} />
        <Btn label="6" variant="num" isShift={false} onClick={() => app('6')} />
        <Btn label="×" variant="op"  isShift={false} onClick={() => app('*')} />
      </Row>
      <Row cols={4}>
        <Btn label="1" variant="num" isShift={false} onClick={() => app('1')} />
        <Btn label="2" variant="num" isShift={false} onClick={() => app('2')} />
        <Btn label="3" variant="num" isShift={false} onClick={() => app('3')} />
        <Btn label="−" variant="op"  isShift={false} onClick={() => app('-')} />
      </Row>
      <Row cols={4}>
        <Btn label="0"  variant="num" isShift={false} onClick={() => app('0')} />
        <Btn label="."  variant="num" isShift={false} onClick={() => app('.')} />
        <Btn label="(−)" variant="action" isShift={false} onClick={() => app('-')} />
        <Btn label="+"  variant="op"  isShift={false} onClick={() => app('+')} />
      </Row>

      {/* Separator */}
      <div style={{ height: '3px', background: '#12141a', borderRadius: '2px', margin: '2px 0' }} />

      {/* Bottom: backspace & clear */}
      <Row cols={2}>
        <Btn label="⌫" variant="action" isShift={false}
          onClick={() => dispatch({ type: 'BACKSPACE' })} />
        <Btn label="AC" variant="clear" isShift={false}
          onClick={() => dispatch({ type: 'CLEAR' })} />
      </Row>

      {/* Action bar: plot & equals */}
      <Row cols={2} gap={6}>
        <Btn
          label={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>∫</span> PLOT
            </span>
          }
          variant="plot"
          isShift={false}
          disabled={!isGraphMode}
          onClick={onPlot}
          wide={false}
        />
        <Btn
          label="="
          variant="equals"
          isShift={false}
          disabled={isGraphMode}
          onClick={() => dispatch({ type: 'EQUALS' })}
          wide={false}
        />
      </Row>

    </div>
  )
}
