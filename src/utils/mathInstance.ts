import { create, all } from 'mathjs'

export const math = create(all)
export type AngleMode = 'DEG' | 'RAD'

export function setAngleMode(mode: AngleMode): void {
  math.config({ angleMode: mode === 'DEG' ? 'deg' : 'rad' })
}
