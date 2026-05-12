import { useState, useRef, useCallback } from 'react'
import { DataPoint } from '../utils/graphUtils'

const POINTS_PER_FRAME = 10

interface UseAnimationReturn {
  visiblePoints: DataPoint[]
  isAnimating: boolean
  startAnimation: (points: DataPoint[]) => void
  resetAnimation: () => void
}

export function useAnimation(): UseAnimationReturn {
  const [visiblePoints, setVisiblePoints] = useState<DataPoint[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const rafRef = useRef<number | null>(null)
  const allPointsRef = useRef<DataPoint[]>([])
  const currentIndexRef = useRef(0)

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startAnimation = useCallback((points: DataPoint[]) => {
    cancelAnimation()
    allPointsRef.current = points
    currentIndexRef.current = 0
    setVisiblePoints([])
    setIsAnimating(true)

    const step = () => {
      currentIndexRef.current = Math.min(
        currentIndexRef.current + POINTS_PER_FRAME,
        allPointsRef.current.length
      )
      setVisiblePoints(allPointsRef.current.slice(0, currentIndexRef.current))

      if (currentIndexRef.current < allPointsRef.current.length) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setIsAnimating(false)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }, [cancelAnimation])

  const resetAnimation = useCallback(() => {
    cancelAnimation()
    allPointsRef.current = []
    currentIndexRef.current = 0
    setVisiblePoints([])
    setIsAnimating(false)
  }, [cancelAnimation])

  return { visiblePoints, isAnimating, startAnimation, resetAnimation }
}
