import { useReducer, useEffect } from 'react'
import { evaluateExpression, isGraphExpression, AngleMode } from '../utils/parser'

export type { AngleMode }

export interface HistoryEntry {
  id: number
  expression: string
  result: string
  isGraph: boolean
  timestamp: Date
}

interface CalcState {
  expression: string
  result: string
  isShift: boolean
  angleMode: AngleMode
  ans: string
  history: HistoryEntry[]
  nextId: number
  justEvaluated: boolean
  hasError: boolean
}

type CalcAction =
  | { type: 'APPEND'; value: string }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR' }
  | { type: 'EQUALS' }
  | { type: 'TOGGLE_SHIFT' }
  | { type: 'TOGGLE_ANGLE' }
  | { type: 'LOAD'; expression: string }
  | { type: 'ADD_GRAPH_HISTORY'; expression: string }
  | { type: 'CLEAR_HISTORY' }

const STORAGE_KEY = 'fx_calc_history'

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as HistoryEntry[]).map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }))
  } catch {
    return []
  }
}

function initState(): CalcState {
  const history = loadHistory()
  return {
    expression: '',
    result: '',
    isShift: false,
    angleMode: 'DEG',
    ans: '0',
    history,
    nextId: history.length > 0 ? Math.max(...history.map(e => e.id)) + 1 : 1,
    justEvaluated: false,
    hasError: false,
  }
}

function reducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'APPEND': {
      // After any = press, start fresh — graph expressions are never justEvaluated
      const base = state.justEvaluated ? '' : state.expression

      const value = action.value === 'ANS' ? state.ans : action.value
      const newExpr = base + value

      return {
        ...state,
        expression: newExpr,
        result: '',
        justEvaluated: false,
        hasError: false,
        isShift: false,
      }
    }

    case 'BACKSPACE': {
      if (state.hasError) return { ...state, expression: '', result: '', hasError: false }
      if (!state.expression) return state
      const newExpr = state.expression.slice(0, -1)
      return { ...state, expression: newExpr, result: '', justEvaluated: false }
    }

    case 'CLEAR':
      return { ...state, expression: '', result: '', justEvaluated: false, hasError: false, isShift: false }

    case 'EQUALS': {
      const expr = state.expression.trim()
      if (!expr || isGraphExpression(expr)) return state

      const { value, error } = evaluateExpression(expr, state.angleMode)

      if (error === 'syntax') {
        return { ...state, result: value, hasError: true, justEvaluated: true }
      }

      if (error === 'domain') {
        const entry: HistoryEntry = {
          id: state.nextId,
          expression: expr,
          result: 'undefined',
          isGraph: false,
          timestamp: new Date(),
        }
        return {
          ...state,
          expression: 'undefined',
          result: '= undefined',
          hasError: true,
          justEvaluated: true,
          history: [entry, ...state.history].slice(0, 20),
          nextId: state.nextId + 1,
        }
      }

      const entry: HistoryEntry = {
        id: state.nextId,
        expression: expr,
        result: value,
        isGraph: false,
        timestamp: new Date(),
      }

      return {
        ...state,
        expression: value,
        result: '= ' + value,
        ans: value,
        justEvaluated: true,
        hasError: false,
        history: [entry, ...state.history].slice(0, 20),
        nextId: state.nextId + 1,
      }
    }

    case 'TOGGLE_SHIFT':
      return { ...state, isShift: !state.isShift }

    case 'TOGGLE_ANGLE':
      return { ...state, angleMode: state.angleMode === 'DEG' ? 'RAD' : 'DEG' }

    case 'LOAD':
      return {
        ...state,
        expression: action.expression,
        result: '',
        justEvaluated: false,
        hasError: false,
        isShift: false,
      }

    case 'CLEAR_HISTORY':
      return { ...state, history: [], nextId: 1 }

    case 'ADD_GRAPH_HISTORY': {
      const entry: HistoryEntry = {
        id: state.nextId,
        expression: action.expression,
        result: 'graph',
        isGraph: true,
        timestamp: new Date(),
      }
      return {
        ...state,
        history: [entry, ...state.history].slice(0, 20),
        nextId: state.nextId + 1,
      }
    }

    default:
      return state
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history))
  }, [state.history])

  return {
    expression: state.expression,
    result: state.result,
    isShift: state.isShift,
    angleMode: state.angleMode,
    ans: state.ans,
    history: state.history,
    hasError: state.hasError,
    isGraphMode: isGraphExpression(state.expression),
    dispatch,
  }
}
