import { math, AngleMode, setAngleMode } from './mathInstance'

export type { AngleMode }

export type EvalError = 'domain' | 'syntax'

const EPS = 1e-9

// Scope overrides mathjs built-ins so angle mode is always reliable regardless of math.config()
function makeEvalScope(angleMode: AngleMode): Record<string, unknown> {
  const toRad   = angleMode === 'DEG' ? Math.PI / 180 : 1
  const fromRad = angleMode === 'DEG' ? 180 / Math.PI : 1

  return {
    pi:    Math.PI,
    e:     Math.E,
    sin:   (x: number) => Math.sin(x * toRad),
    cos:   (x: number) => Math.cos(x * toRad),
    tan:   (x: number) => Math.tan(x * toRad),
    asin:  (x: number) => Math.asin(x) * fromRad,
    acos:  (x: number) => Math.acos(x) * fromRad,
    atan:  (x: number) => Math.atan(x) * fromRad,
    atan2: (y: number, x: number) => Math.atan2(y, x) * fromRad,
    log:   (x: number) => Math.log(x),
    log10: (x: number) => Math.log10(x),
    sqrt:  (x: number) => Math.sqrt(x),
    cbrt:  (x: number) => Math.cbrt(x),
    abs:   (x: number) => Math.abs(x),
    exp:   (x: number) => Math.exp(x),
    factorial: (x: number) => {
      if (x < 0 || !Number.isInteger(x) || x > 170) return NaN
      let r = 1; for (let i = 2; i <= x; i++) r *= i; return r
    },
  }
}

// Catches tan(90°), sqrt(-4), log(0), asin(2) etc. BEFORE math.evaluate is called,
// so garbage floats from near-asymptotes can't slip through.
function preEvalCheck(expr: string, angleMode: AngleMode): boolean {
  const m = /^([a-zA-Z_]\w*)\s*\(\s*(-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*\)$/.exec(expr)
  if (!m) return false

  const fn  = m[1].toLowerCase()
  const arg = parseFloat(m[2])
  if (isNaN(arg)) return false

  if (fn === 'tan') {
    const deg = angleMode === 'DEG' ? arg : arg * (180 / Math.PI)
    const mod = Math.abs(((deg % 180) + 180) % 180 - 90)
    if (mod < EPS) return true
  }

  if (fn === 'sqrt' && arg < 0) return true
  if ((fn === 'log' || fn === 'log10') && arg <= 0) return true
  if ((fn === 'asin' || fn === 'acos') && (arg < -1 - EPS || arg > 1 + EPS)) return true

  return false
}

export function evaluateAt(expr: string, x: number, angleMode: AngleMode = 'RAD'): number | null {
  try {
    setAngleMode(angleMode)
    const scope: Record<string, unknown> = { ...makeEvalScope(angleMode), x }
    const result = math.evaluate(expr, scope)
    if (
      typeof result !== 'number' ||
      !isFinite(result) ||
      Math.abs(result) > 1e15
    ) return null
    return result
  } catch {
    return null
  }
}

export function evaluateExpression(
  expr: string,
  angleMode: AngleMode = 'DEG',
): { value: string; error: EvalError | null } {
  const trimmed = expr.trim()

  if (preEvalCheck(trimmed, angleMode)) {
    return { value: 'undefined', error: 'domain' }
  }

  try {
    setAngleMode(angleMode)
    const scope = makeEvalScope(angleMode)
    const result = math.evaluate(trimmed, scope)

    if (typeof result === 'number') {
      if (!isFinite(result)) return { value: 'undefined', error: 'domain' }
      // Near-asymptote values that slip past preEvalCheck (e.g. tan(45+45) in DEG)
      if (Math.abs(result) > 1e15) return { value: 'undefined', error: 'domain' }
      return { value: parseFloat(result.toFixed(10)).toString(), error: null }
    }

    if (math.typeOf(result) === 'Complex') {
      return { value: 'undefined', error: 'domain' }
    }

    return { value: String(result), error: null }
  } catch {
    return { value: 'Syntax Error', error: 'syntax' }
  }
}

// True if expression contains standalone 'x' (not inside function names like exp/max)
export function isGraphExpression(expr: string): boolean {
  return /(?<![a-zA-Z])x(?![a-zA-Z])/.test(expr)
}
