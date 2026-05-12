export interface NormalizeResult {
  expr: string
  warnings: string[]
}

export type ImportResult =
  | { ok: true; result: NormalizeResult }
  | { ok: false; error: string }

const KNOWN_FUNCS = [
  'log10', 'asin', 'acos', 'atan', 'atan2',
  'sin', 'cos', 'tan',
  'sqrt', 'cbrt', 'log', 'abs', 'exp', 'factorial',
]

const SUP: Record<string, string> = {
  '¹': '1', '²': '2', '³': '3',
  '⁰': '0', '⁴': '4', '⁵': '5',
  '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
}
const SUP_RE = new RegExp('[' + Object.keys(SUP).join('') + ']+', 'g')

export function importFromText(content: string): ImportResult {
  const lines = content
    .split(/\r?\n/)
    .slice(0, 80)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('//') && !l.startsWith('%'))

  if (lines.length === 0) return { ok: false, error: 'File is empty' }

  // Prefer lines with a definition prefix, then fall back to any line
  const ordered = [
    ...lines.filter(l => /^[a-zA-Z](?:\([^)]*\))?\s*=/.test(l)),
    ...lines.filter(l => !/^[a-zA-Z](?:\([^)]*\))?\s*=/.test(l)),
  ]

  for (const line of ordered) {
    const result = normalizeLine(line)
    if (result && looksLikeExpression(result.expr)) {
      return { ok: true, result }
    }
  }

  const fallback = normalizeLine(lines[0])
  return fallback
    ? { ok: true, result: fallback }
    : { ok: false, error: 'No valid expression found in file' }
}

function normalizeLine(raw: string): NormalizeResult | null {
  if (!raw.trim()) return null
  const warnings: string[] = []
  let s = raw.trim()

  // 1. strip f(x)= prefix — handles both bare and outer-paren wrapped forms
  const wrapped = /^\(\s*[a-zA-Z]\w*\s*(?:\([^)]*\))?\s*=(?!=)\s*([\s\S]*)\)\s*$/.exec(s)
  if (wrapped) {
    s = wrapped[1].trim()
  } else {
    s = s.replace(/^[a-zA-Z]\w*\s*(?:\([^)]*\))?\s*=(?!=)\s*/, '').trim()
  }

  // 2. unicode minus (U+2212) → ASCII hyphen
  s = s.replace(/−/g, '-')

  // 3. unicode multiplication → *
  s = s.replace(/[×⋅·∙⊗]/g, '*')

  // 4. unicode division → /
  s = s.replace(/÷/g, '/')

  // 5. unicode constants
  s = s.replace(/π/g, 'pi')
  s = s.replace(/τ/g, '(2*pi)')
  s = s.replace(/∞/g, 'Infinity')
  s = s.replace(/ℯ/g, 'e')
  s = s.replace(/ⅇ/g, 'e')

  // 6. unicode superscripts: x² → x^2
  s = s.replace(SUP_RE, m => '^' + [...m].map(c => SUP[c] ?? c).join(''))

  // 7. root symbols
  s = s.replace(/√\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, 'sqrt($1)')
  s = s.replace(/√\s*([a-zA-Z0-9.]+)/g,                   'sqrt($1)')
  s = s.replace(/∛\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, 'cbrt($1)')
  s = s.replace(/∛\s*([a-zA-Z0-9.]+)/g,                   'cbrt($1)')

  // 8. |expr| → abs(expr) — non-nested only to avoid ambiguity with bitwise OR
  s = s.replace(/\|([^|+\-*/^()[\]{}]+)\|/g, 'abs($1)')

  // 9. Python/MATLAB ** → ^
  s = s.replace(/\*\*/g, '^')

  // 10. pow(base, exp) → (base)^(exp)
  s = s.replace(/\bpow\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)/g, '($1)^($2)')

  // 11. function name normalization
  const FUNC_MAP: [RegExp, string, string?][] = [
    [/\barcsin\b/gi,  'asin'],
    [/\barccos\b/gi,  'acos'],
    [/\barctan\b/gi,  'atan'],
    [/\barc\s*sin\b/gi, 'asin'],
    [/\barc\s*cos\b/gi, 'acos'],
    [/\barc\s*tan\b/gi, 'atan'],
    [/\barsin\b/gi,   'asin'],
    [/\barcos\b/gi,   'acos'],
    [/\bartan\b/gi,   'atan'],
    [/\bsin-1\b/gi,   'asin', 'sin⁻¹ → asin'],
    [/\bcos-1\b/gi,   'acos', 'cos⁻¹ → acos'],
    [/\btan-1\b/gi,   'atan', 'tan⁻¹ → atan'],
    [/\btg\b/gi,      'tan',    'tg → tan'],
    [/\bctg\b/gi,     '__cot__', 'ctg → 1/tan'],
    [/\bcot\b/gi,     '__cot__', 'cot → 1/tan'],
    [/\bcotg\b/gi,    '__cot__', 'cotg → 1/tan'],
    [/\bln\b/gi,      'log',    'ln → log (natural)'],
    [/\blg\b/gi,      'log10',  'lg → log10'],
    [/\bLOG\b/g,      'log'],
    [/\bLog\b/g,      'log'],
    [/\bSIN\b/g,      'sin'],
    [/\bSin\b/g,      'sin'],
    [/\bCOS\b/g,      'cos'],
    [/\bCos\b/g,      'cos'],
    [/\bTAN\b/g,      'tan'],
    [/\bTan\b/g,      'tan'],
    [/\bSQRT\b/g,     'sqrt'],
    [/\bSqrt\b/g,     'sqrt'],
    [/\bABS\b/g,      'abs'],
    [/\bAbs\b/g,      'abs'],
    [/\bEXP\b/g,      'exp'],
    [/\bExp\b/g,      'exp'],
    [/\bPI\b/g,       'pi'],
    [/\bPi\b/g,       'pi'],
    [/\bE\b/g,        'e'],
  ]

  for (const [re, to, warn] of FUNC_MAP) {
    if (re.test(s)) {
      if (warn) warnings.push(warn)
      s = s.replace(re, to)
    }
  }

  s = s.replace(/__cot__\s*\(([^()]*)\)/g, '(1/tan($1))')
  s = s.replace(/__cot__/g, 'tan')

  // 12. sin²(x) / fn^n(arg) → (fn(arg))^n
  const TRIG_PAT = KNOWN_FUNCS.join('|')
  s = s.replace(
    new RegExp(`\\b(${TRIG_PAT})\\s*\\^\\s*(\\d+)\\s*\\(([^()]*)\\)`, 'g'),
    '($1($3))^$2',
  )

  // 13. implicit multiplication (order matters — most specific first)
  const funcPat = KNOWN_FUNCS.join('|')
  s = s.replace(new RegExp(`(\\d)(${funcPat})\\(`, 'g'), '$1*$2(')
  s = s.replace(/(\d)(pi)(?![a-zA-Z0-9_])/g, '$1*$2')
  s = s.replace(/(\d)(e)(?![a-zA-Z0-9_+\-])/g, '$1*$2')
  s = s.replace(/(\d)(x)(?![a-zA-Z0-9_])/g, '$1*$2')
  s = s.replace(/(\d)\s*\(/g, '$1*(')
  s = s.replace(/\)\s*\(/g, ')*(')
  s = s.replace(/\)\s*(x)(?![a-zA-Z_])/g, ')*$1')
  s = s.replace(/\b(x)\s*\(/g, '$1*(')
  s = s.replace(/\)\s*(\d)/g, ')*$1')

  // 14. normalize whitespace
  s = s.replace(/\s+/g, ' ').trim()

  return { expr: s, warnings }
}

function looksLikeExpression(s: string): boolean {
  if (!s || s.length < 1) return false
  return /[0-9x]/.test(s) && !/^[a-zA-Z\s]{20,}$/.test(s)
}
