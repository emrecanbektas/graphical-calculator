import type { AngleMode } from './mathInstance'
import type { DataPoint } from './graphUtils'

const EPS = 1e-9
const PI = Math.PI

// graphUtils clips y at ±1000, so true asymptote sides register near ±1000;
// domain boundaries transition from null to a small value.
const ASYMPTOTE_FLOOR = 50

const DEDUPE_DIST = 0.3

export interface Singularity {
  x: number
  type: 'asymptote' | 'boundary'
  shortLabel: string
  fullLabel: string
}

export interface DomainStatus {
  ok: boolean
  reason?: string
}

function hasFn(expr: string, fn: string): boolean {
  return new RegExp(`\\b${fn}\\s*\\(`).test(expr)
}

export function checkDomainAt(expr: string, x: number, angleMode: AngleMode): DomainStatus {
  const e = expr.toLowerCase()

  if (hasFn(e, 'tan')) {
    let nearAsymptote: boolean
    if (angleMode === 'DEG') {
      const mod = ((x % 180) + 180) % 180
      nearAsymptote = Math.abs(mod - 90) < EPS
    } else {
      const mod = ((x % PI) + PI) % PI
      nearAsymptote = Math.abs(mod - PI / 2) < EPS
    }
    if (nearAsymptote) {
      const where = angleMode === 'DEG' ? `${x}°` : `${x.toFixed(6)}`
      return { ok: false, reason: `tan is undefined at x = ${where} (vertical asymptote)` }
    }
  }

  if (hasFn(e, 'log') || hasFn(e, 'log10')) {
    if (x <= EPS) {
      return { ok: false, reason: 'log is undefined for x ≤ 0 (domain: x > 0)' }
    }
  }

  if (hasFn(e, 'sqrt')) {
    if (x < -EPS) {
      return { ok: false, reason: '√ is undefined for x < 0 (negative input)' }
    }
  }

  if (hasFn(e, 'asin')) {
    if (x < -1 - EPS || x > 1 + EPS) {
      return { ok: false, reason: `asin is undefined at x = ${x} (domain is [-1, 1])` }
    }
  }

  if (hasFn(e, 'acos')) {
    if (x < -1 - EPS || x > 1 + EPS) {
      return { ok: false, reason: `acos is undefined at x = ${x} (domain is [-1, 1])` }
    }
  }

  if (/\/\s*x\b/.test(e) || /\bx\s*\^\s*-/.test(e)) {
    if (Math.abs(x) < EPS) {
      return { ok: false, reason: '1/x is undefined at x = 0 (division by zero)' }
    }
  }

  const fractionalPow = /\bx\s*\^\s*[\(\[]?\s*(?:\d+\s*\/\s*\d+|0\.\d+)/.test(e)
  if (fractionalPow && x < -EPS) {
    return { ok: false, reason: 'x^n with fractional n is undefined for x < 0 (negative base)' }
  }

  return { ok: true }
}

export function detectSingularities(expr: string, points: DataPoint[]): Singularity[] {
  const raw: Singularity[] = []

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const midX = (prev.x + curr.x) / 2

    const prevDefined = prev.y !== null
    const currDefined = curr.y !== null

    if (prevDefined && currDefined) {
      if (
        Math.sign(prev.y!) !== Math.sign(curr.y!) &&
        (Math.abs(prev.y!) >= ASYMPTOTE_FLOOR || Math.abs(curr.y!) >= ASYMPTOTE_FLOOR)
      ) {
        raw.push(makeSingularity(expr, midX, 'asymptote'))
      }
    } else if (prevDefined !== currDefined) {
      const definedY = prevDefined ? prev.y! : curr.y!
      if (Math.abs(definedY) < ASYMPTOTE_FLOOR) {
        raw.push(makeSingularity(expr, midX, 'boundary'))
      } else {
        raw.push(makeSingularity(expr, midX, 'asymptote'))
      }
    }
  }

  return dedupe(raw)
}

function makeSingularity(expr: string, x: number, type: 'asymptote' | 'boundary'): Singularity {
  const e = expr.toLowerCase()
  const xs = x.toFixed(2)

  if (type === 'asymptote') {
    if (hasFn(e, 'tan')) {
      return { x, type, shortLabel: 'tan ∞', fullLabel: `tan asymptote at x ≈ ${xs}` }
    }
    if (/\/\s*x\b/.test(e) || /\bx\s*\^\s*-/.test(e)) {
      return { x, type, shortLabel: '1/x ∞', fullLabel: `1/x asymptote at x = 0` }
    }
    return { x, type, shortLabel: '∞', fullLabel: `Vertical asymptote at x ≈ ${xs}` }
  }

  if (hasFn(e, 'sqrt')) {
    return { x, type, shortLabel: '√ ∂', fullLabel: `√ domain boundary at x ≈ ${xs} — undefined for x < ${xs}` }
  }
  if (hasFn(e, 'log10') || hasFn(e, 'log')) {
    return { x, type, shortLabel: 'log ∂', fullLabel: `log domain boundary at x ≈ ${xs} — undefined for x ≤ ${xs}` }
  }
  if (hasFn(e, 'asin')) {
    return { x, type, shortLabel: 'asin ∂', fullLabel: `asin domain boundary at x ≈ ${xs} (domain: [-1, 1])` }
  }
  if (hasFn(e, 'acos')) {
    return { x, type, shortLabel: 'acos ∂', fullLabel: `acos domain boundary at x ≈ ${xs} (domain: [-1, 1])` }
  }
  return { x, type, shortLabel: '∂', fullLabel: `Domain boundary at x ≈ ${xs}` }
}

function dedupe(items: Singularity[]): Singularity[] {
  const out: Singularity[] = []
  for (const item of items) {
    if (!out.some(r => Math.abs(r.x - item.x) < DEDUPE_DIST)) {
      out.push(item)
    }
  }
  return out
}
