import { evaluateAt, AngleMode } from './parser'

export interface DataPoint {
  x: number
  y: number | null
}

export function generateDataPoints(
  expr: string,
  xMin: number,
  xMax: number,
  steps = 300,
  angleMode: AngleMode = 'RAD'
): DataPoint[] {
  const points: DataPoint[] = []
  const step = (xMax - xMin) / steps

  for (let i = 0; i <= steps; i++) {
    const x = parseFloat((xMin + i * step).toFixed(6))
    const y = evaluateAt(expr, x, angleMode)
    points.push({ x, y: y !== null && Math.abs(y) <= 1000 ? y : null })
  }

  return points
}

export function getYDomain(points: DataPoint[]): [number, number] {
  const valid = points.map(p => p.y).filter((y): y is number => y !== null)
  if (valid.length === 0) return [-10, 10]
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const pad = Math.max(1, (max - min) * 0.1)
  return [Math.floor(min - pad), Math.ceil(max + pad)]
}
