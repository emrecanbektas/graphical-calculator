import { useEffect, useState, useMemo, useRef } from 'react'
import { useAnimation } from '../../hooks/useAnimation'
import { generateDataPoints, getYDomain } from '../../utils/graphUtils'
import { evaluateAt } from '../../utils/parser'
import { checkDomainAt, detectSingularities, Singularity } from '../../utils/domainAnalysis'
import { AngleMode } from '../../hooks/useCalculator'
import AnimatedGraph, { EvalPoint } from './AnimatedGraph'

interface GraphOverlayProps {
  expression: string
  angleMode: AngleMode
  isOpen: boolean
  onClose: () => void
  onPlotted: (expression: string) => void
}

export default function GraphOverlay({ expression, angleMode, isOpen, onClose, onPlotted }: GraphOverlayProps) {
  const [xMin, setXMin] = useState(-10)
  const [xMax, setXMax] = useState(10)
  const [yDomain, setYDomain] = useState<[number, number]>([-10, 10])
  const [hasPlotted, setHasPlotted] = useState(false)
  const [singularities, setSingularities] = useState<Singularity[]>([])

  const [evalInput, setEvalInput] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Strip any "f(x) =" prefix that was not caught by the normalizer
  const cleanExpr = (() => {
    const m = /^\(\s*[a-zA-Z]\w*\s*(?:\([^)]*\))?\s*=(?!=)\s*([\s\S]*)\)\s*$/.exec(expression)
    if (m) return m[1].trim()
    return expression.replace(/^[a-zA-Z]\w*\s*(?:\([^)]*\))?\s*=(?!=)\s*/, '').trim() || expression
  })()

  const { visiblePoints, isAnimating, startAnimation, resetAnimation } = useAnimation()

  const graphContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartClientX = useRef(0)
  const dragStartRange = useRef<[number, number]>([xMin, xMax])
  const xMinRef = useRef(xMin)
  const xMaxRef = useRef(xMax)
  const replotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { xMinRef.current = xMin }, [xMin])
  useEffect(() => { xMaxRef.current = xMax }, [xMax])

  // Reassigned every render so stable event handlers always call with fresh expression/angleMode
  const scheduleReplotRef = useRef<() => void>(() => {})
  scheduleReplotRef.current = () => {
    if (replotTimerRef.current) clearTimeout(replotTimerRef.current)
    replotTimerRef.current = setTimeout(() => {
      const pts = generateDataPoints(cleanExpr, xMinRef.current, xMaxRef.current, 300, angleMode)
      setYDomain(getYDomain(pts))
      setSingularities(detectSingularities(cleanExpr, pts))
      setHasPlotted(true)
      startAnimation(pts)
    }, 300)
  }

  useEffect(() => {
    const el = graphContainerRef.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2
      const mid = (xMinRef.current + xMaxRef.current) / 2
      const half = ((xMaxRef.current - xMinRef.current) / 2) * factor
      xMinRef.current = mid - half
      xMaxRef.current = mid + half
      setXMin(xMinRef.current)
      setXMax(xMaxRef.current)
      scheduleReplotRef.current()
    }

    function onMouseDown(e: MouseEvent) {
      isDraggingRef.current = true
      setIsDragging(true)
      dragStartClientX.current = e.clientX
      dragStartRange.current = [xMinRef.current, xMaxRef.current]
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return
      const containerWidth = el.getBoundingClientRect().width
      const plotWidth = Math.max(containerWidth - 65, 1) // 45px YAxis + 20px right margin
      const range = dragStartRange.current[1] - dragStartRange.current[0]
      const delta = ((dragStartClientX.current - e.clientX) / plotWidth) * range
      xMinRef.current = dragStartRange.current[0] + delta
      xMaxRef.current = dragStartRange.current[1] + delta
      setXMin(xMinRef.current)
      setXMax(xMaxRef.current)
    }

    function onMouseUp() {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      scheduleReplotRef.current()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // empty deps: handlers are stable and read state via refs

  const evalResult = useMemo<{
    point: EvalPoint | null
    label: string
    status: 'idle' | 'ok' | 'undefined' | 'outOfRange' | 'invalid'
  }>(() => {
    const raw = evalInput.trim()
    if (raw === '') return { point: null, label: '', status: 'idle' }

    const x = Number(raw)
    if (isNaN(x)) return { point: null, label: '', status: 'invalid' }

    if (x < xMin || x > xMax) {
      return { point: null, label: 'x is outside graph range', status: 'outOfRange' }
    }

    const domain = checkDomainAt(cleanExpr, x, angleMode)
    if (!domain.ok) {
      return { point: null, label: domain.reason!, status: 'undefined' }
    }

    const y = evaluateAt(cleanExpr, x, angleMode)

    if (y === null) {
      const reason = inferUndefinedReason(cleanExpr, x)
      return { point: null, label: reason, status: 'undefined' }
    }

    const xStr = parseFloat(x.toFixed(6)).toString() + (angleMode === 'DEG' ? '°' : '')
    const yStr = parseFloat(y.toFixed(8)).toString()
    return {
      point: { x, y },
      label: `f(${xStr}) = ${yStr}`,
      status: 'ok',
    }
  }, [evalInput, cleanExpr, angleMode, xMin, xMax])

  function exportPNG() {
    const el = graphContainerRef.current
    if (!el) return
    const svg = el.querySelector('svg')
    if (!svg) return

    const { width, height } = svg.getBoundingClientRect()
    const scale = 2

    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', '0'); bg.setAttribute('y', '0')
    bg.setAttribute('width', String(width)); bg.setAttribute('height', String(height))
    bg.setAttribute('fill', '#0a0c10')
    clone.insertBefore(bg, clone.firstChild)

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', '10')
    label.setAttribute('y', String(height - 8))
    label.setAttribute('fill', 'rgba(100,116,139,0.65)')
    label.setAttribute('font-size', '10')
    label.setAttribute('font-family', 'Courier New, monospace')
    label.textContent = `f(x) = ${cleanExpr}`
    clone.appendChild(label)

    const svgStr = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.fillStyle = '#0a0c10'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      const safeName = cleanExpr.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
      link.download = `f(x)=${safeName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = url
  }

  function triggerPlot() {
    const points = generateDataPoints(cleanExpr, xMin, xMax, 300, angleMode)
    const domain = getYDomain(points)
    const sings = detectSingularities(cleanExpr, points)
    setYDomain(domain)
    setSingularities(sings)
    setHasPlotted(true)
    startAnimation(points)
    onPlotted(cleanExpr)
  }

  useEffect(() => {
    if (isOpen && expression) triggerPlot()
    if (!isOpen) {
      resetAnimation()
      setHasPlotted(false)
      setSingularities([])
      setEvalInput('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, expression])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: `translateX(-50%) translateY(${isOpen ? '0' : '100%'})`,
        width: '100%', maxWidth: '540px',
        background: '#14161d',
        border: '1px solid #2a2d38', borderBottom: 'none',
        borderRadius: '20px 20px 0 0',
        zIndex: 50,
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', background: '#2a2d38', borderRadius: '2px' }} />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 6px',
        }}>
          <div>
            <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Graphing
            </div>
            <div style={{ color: '#22d3ee', fontSize: '0.95rem', fontWeight: 500, fontFamily: 'monospace' }}>
              f(x) = {cleanExpr}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2d38',
            borderRadius: '8px', color: '#64748b', padding: '6px 12px',
            cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif",
          }}>
            ✕ Close
          </button>
        </div>

        <div style={{
          margin: '6px 20px 0',
          background: '#0f1015', border: '1px solid #1e2028', borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
        }}>
          <span style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Evaluate at x =
          </span>
          <input
            type="number"
            value={evalInput}
            onChange={e => setEvalInput(e.target.value)}
            placeholder="e.g. 30"
            style={{
              width: '80px',
              background: '#1a1c22',
              border: `1px solid ${
                evalResult.status === 'undefined' || evalResult.status === 'outOfRange'
                  ? 'rgba(244,63,94,0.4)'
                  : evalResult.status === 'ok'
                  ? 'rgba(34,211,238,0.4)'
                  : '#2a2d38'
              }`,
              borderRadius: '6px', padding: '5px 8px',
              color: '#f1f5f9', fontSize: '0.85rem', fontFamily: 'monospace',
              outline: 'none', textAlign: 'center', transition: 'border-color 0.15s',
            }}
          />
          <span style={{ color: '#2a2d38', fontSize: '0.9rem', flexShrink: 0 }}>→</span>
          <span style={{
            fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 500,
            color:
              evalResult.status === 'ok'       ? '#22d3ee' :
              evalResult.status === 'outOfRange'? '#f59e0b' :
              evalResult.status === 'undefined' ? '#f43f5e' :
              '#2a2d38',
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {evalResult.status === 'idle' ? 'result appears here' : evalResult.label}
          </span>
        </div>

        {singularities.length > 0 && (
          <div style={{ margin: '6px 20px 0' }}>
            <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Detected singularities
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '3px',
              maxHeight: '80px', overflowY: 'auto',
            }}>
              {singularities.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#0f1015', borderRadius: '6px', padding: '4px 10px',
                  border: `1px solid ${s.type === 'asymptote' ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace',
                    color: s.type === 'asymptote' ? '#f43f5e' : '#f59e0b',
                    flexShrink: 0,
                  }}>
                    {s.type === 'asymptote' ? '∞' : '∂'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {s.fullLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 20px 6px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.78rem' }}>
            <span>x:</span>
            <input type="number" value={xMin} onChange={e => setXMin(Number(e.target.value))} style={rangeInputStyle} />
            <span>to</span>
            <input type="number" value={xMax} onChange={e => setXMax(Number(e.target.value))} style={rangeInputStyle} />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={exportPNG}
            disabled={!hasPlotted}
            style={{
              background: hasPlotted ? 'rgba(99,102,241,0.1)' : 'transparent',
              border: '1px solid rgba(99,102,241,0.25)',
              borderRadius: '8px',
              color: hasPlotted ? '#6366f1' : '#2a2d38',
              padding: '5px 12px', fontSize: '0.78rem',
              cursor: hasPlotted ? 'pointer' : 'default',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              transition: 'all 0.15s',
            }}
          >
            ↓ PNG
          </button>
          <button
            onClick={triggerPlot}
            disabled={isAnimating}
            style={{
              background: isAnimating ? 'rgba(34,211,238,0.05)' : 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)', borderRadius: '8px',
              color: '#22d3ee', padding: '5px 12px', fontSize: '0.78rem',
              cursor: isAnimating ? 'not-allowed' : 'pointer',
              fontFamily: "'Inter', sans-serif", fontWeight: 600,
              opacity: isAnimating ? 0.5 : 1,
            }}
          >
            {isAnimating ? 'Drawing…' : '↺ Re-plot'}
          </button>
        </div>

        <div style={{ padding: '0 12px 12px' }}>
          <div
            ref={graphContainerRef}
            style={{
              background: '#0a0c10', border: '1px solid #1e2028',
              borderRadius: '12px', padding: '8px 4px 4px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
            }}
          >
            <AnimatedGraph
              visiblePoints={visiblePoints}
              yDomain={yDomain}
              hasData={hasPlotted}
              evalPoint={evalResult.point}
              angleMode={angleMode}
              singularities={singularities}
            />
          </div>
          <div style={{
            textAlign: 'center',
            color: '#2a2d38',
            fontSize: '0.62rem',
            letterSpacing: '0.05em',
            fontFamily: "'Inter', sans-serif",
            padding: '6px 0 4px',
          }}>
            scroll to zoom · drag to pan
          </div>
        </div>
      </div>
    </>
  )
}

// When evaluateAt returns null but checkDomainAt passed (composite arg case),
// infer a human-readable reason from expression patterns.
function inferUndefinedReason(expr: string, x: number): string {
  const e = expr.toLowerCase()
  if (/\btan\s*\(/.test(e)) return 'tan undefined here (asymptote)'
  if (/\/\s*x\b/.test(e) && Math.abs(x) < 0.1) return '1/x undefined at x ≈ 0'
  if (/\bsqrt\s*\(/.test(e)) return '√ undefined (negative argument)'
  if (/\b(?:log|log10)\s*\(/.test(e)) return 'log undefined (non-positive argument)'
  if (/\basin\s*\(/.test(e) || /\bacos\s*\(/.test(e)) return 'inverse trig undefined (argument out of [-1, 1])'
  return 'undefined'
}

const rangeInputStyle: React.CSSProperties = {
  width: '60px', background: '#0f1015',
  border: '1px solid #1e2028', borderRadius: '6px',
  padding: '4px 6px', color: '#f1f5f9',
  fontSize: '0.78rem', fontFamily: "'Inter', sans-serif",
  outline: 'none', textAlign: 'center',
}
