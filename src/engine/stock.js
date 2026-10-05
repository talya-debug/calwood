/**
 * תוכנית חיתוך מאורכי מלאי — מקור אחד לכמויות, לשרטוט, למחירון ולתוכנית החיתוך
 *
 * runLength    — אורך כל ריצה (מ'), למשל אורך קורה
 * count        — כמה ריצות כאלה
 * stockLengths — אורכים שיש אצל הספק (מ'), עד 4. ריק = קונים לפי מטר
 * supports     — נקודות תמיכה לאורך הריצה (מ'), שם מותר לחבר. null = אין תמיכות באמצע
 * spliceSpacing — קיצור: תמיכה כל X מ' (במקום supports)
 * multiCut     — מותר לחתוך כמה חתיכות מאותה יחידה (ברירת מחדל: כן)
 * overLength   — מה עושים כשהמרחק בין תמיכות ארוך מהיחידה הארוכה אצל הספק:
 *                'special' = הזמנה מיוחדת באורך הנדרש | 'steel' = חיבור בתושבת ברזל בכל מקום
 *
 * כל החישוב בסנטימטרים שלמים, כדי שלא ייצאו מספרים כמו 8.399999999
 */
export function cutPlan({ runLength, count, stockLengths, stockLength, supports = null, spliceSpacing = null,
  multiCut = true, overLength = 'special' }) {
  const run = toCm(runLength)
  const n = Math.max(0, Math.round(Number(count) || 0))
  const lengths = normalizeLengths(stockLengths ?? (stockLength ? [stockLength] : []))
  const neededM = toM(run * n)

  const base = { bars: n, stockLength: toM(run), stockLengths: lengths.map(toM), purchasedM: neededM, neededM, wasteM: 0, wastePct: 0,
    runPieces: [toM(run)], patterns: [], specialPieces: 0, specialLength: 0, steelJoints: 0, overLengthGap: 0 }
  // אין אורכי מלאי במחירון — קונים לפי מטר
  if (!lengths.length || run <= 0 || n === 0) return base
  const longest = lengths[lengths.length - 1]

  // 1. איך בונים ריצה אחת: חיבורים רק על נקודת תמיכה
  let points = supports ? supports.map(toCm) : null
  if (!points && spliceSpacing) {
    const sp = toCm(spliceSpacing)
    points = []
    for (let p = 0; p < run; p += sp) points.push(p)
  }
  points = [...new Set([0, ...(points || []), run])].filter(p => p >= 0 && p <= run).sort((a, b) => a - b)

  const runPieces = [] // { len, special }
  let steelJoints = 0, overLengthGap = 0
  let pos = 0
  while (run - pos > longest) {
    const reachable = points.filter(p => p > pos && p <= pos + longest)
    if (reachable.length) {
      const next = reachable[reachable.length - 1]
      runPieces.push({ len: next - pos }); pos = next
      continue
    }
    // המרחק עד התמיכה הבאה ארוך מכל מה שיש אצל הספק
    const nextSupport = points.find(p => p > pos) ?? run
    overLengthGap = Math.max(overLengthGap, nextSupport - pos)
    if (overLength === 'steel') {
      runPieces.push({ len: longest }); pos += longest; steelJoints++
    } else {
      runPieces.push({ len: nextSupport - pos, special: true }); pos = nextSupport
    }
  }
  if (run - pos > 0) runPieces.push({ len: run - pos })

  // 2. אריזה ביחידות מלאי — בוחרים את הצירוף הזול ביותר (הכי מעט מטרים לקנייה)
  const normal = [], specials = []
  for (let i = 0; i < n; i++) runPieces.forEach(p => (p.special ? specials : normal).push(p.len))
  const bins = bestPacking(normal.sort((a, b) => b - a), lengths, multiCut)

  // 3. סיכום
  const specialCm = specials.reduce((s, x) => s + x, 0)
  const purchasedCm = bins.reduce((s, b) => s + b.size, 0) + specialCm
  const wasteCm = purchasedCm - run * n
  const patterns = groupPatterns(bins)
  if (specials.length) patterns.push({ count: specials.length, unitLength: toM(specials[0]), cuts: [toM(specials[0])], offcut: 0, special: true })

  return {
    bars: bins.length + specials.length,
    // האורך העיקרי שנקנה (הנפוץ ביותר) — לתצוגה בכותרת השורה
    stockLength: toM(mostCommon(bins.map(b => b.size)) || longest),
    mixedLengths: new Set(bins.map(b => b.size)).size > 1,
    stockLengths: lengths.map(toM),
    purchasedM: toM(purchasedCm),
    neededM,
    wasteM: toM(wasteCm),
    wastePct: purchasedCm > 0 ? Math.round((wasteCm / purchasedCm) * 100) : 0,
    runPieces: runPieces.map(p => toM(p.len)),
    patterns,
    specialPieces: specials.length,
    specialLength: specials.length ? toM(specials[0]) : 0,
    steelJoints: steelJoints * n,
    overLengthGap: toM(overLengthGap),
  }
}

// אריזה: מנסים כל אורך לבד וגם שילוב אורכים, ולוקחים את מה שקונה הכי מעט מטרים
function bestPacking(pieces, lengths, multiCut) {
  if (!pieces.length) return []
  const fits = (p) => lengths.find(L => L >= p)
  if (!multiCut) return shrink(pieces.map(p => ({ size: fits(p), cuts: [p] })), lengths)

  const candidates = []
  for (const L of lengths) {
    if (L < pieces[0]) continue
    candidates.push(shrink(firstFit(pieces, () => L), lengths))
  }
  candidates.push(shrink(firstFit(pieces, fits), lengths))
  const cost = (bins) => bins.reduce((s, b) => s + b.size, 0) * 1000 + bins.length
  return candidates.sort((a, b) => cost(a) - cost(b))[0]
}

// הגדולה קודם; כל חתיכה נכנסת ליחידה שנשאר בה הכי פחות מקום שמספיק
function firstFit(pieces, newSize) {
  const bins = []
  for (const p of pieces) {
    let best = null
    for (const b of bins) {
      const left = b.size - used(b)
      if (left >= p && (!best || left < best.size - used(best))) best = b
    }
    if (best) best.cuts.push(p)
    else bins.push({ size: newSize(p), cuts: [p] })
  }
  return bins
}

// כל יחידה מוחלפת ביחידה הקצרה ביותר שעדיין מספיקה
function shrink(bins, lengths) {
  return bins.map(b => ({ ...b, size: lengths.find(L => L >= used(b)) ?? b.size }))
}

const used = (b) => b.cuts.reduce((s, x) => s + x, 0)

function mostCommon(arr) {
  const c = {}
  arr.forEach(x => { c[x] = (c[x] || 0) + 1 })
  return Number(Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || 0)
}

// מקבץ יחידות עם אותו דפוס חיתוך: "8 יח' של 4 מ' — בשלמותה"
function groupPatterns(bins) {
  const map = new Map()
  for (const b of bins) {
    const cuts = [...b.cuts].sort((x, y) => y - x)
    const key = b.size + ':' + cuts.join('+')
    const g = map.get(key) || { count: 0, unitLength: toM(b.size), cuts: cuts.map(toM), offcut: toM(b.size - used(b)) }
    g.count++
    map.set(key, g)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

// טקסט קריא לתוכנית החיתוך — מוצג בממשק וב-PDF
export function describeCutPlan(plan, itemName) {
  if (!plan.patterns?.length) return []
  const lines = []
  if (plan.runPieces.length > 1) {
    const how = plan.steelJoints > 0 ? 'חיבור בתושבת ברזל' : plan.specialPieces > 0 ? 'כולל קטע בהזמנה מיוחדת' : 'החיבור על תמיכה'
    lines.push(`כל ${itemName} באורך ${fmtM(sumM(plan.runPieces))} מ' = ${plan.runPieces.map(fmtM).join(' + ')} מ' (${how})`)
  }
  for (const p of plan.patterns) {
    if (p.special) {
      lines.push(`${p.count} יח' בהזמנה מיוחדת, באורך ${fmtM(p.unitLength)} מ' — לוודא מחיר וזמינות מול הספק`)
      continue
    }
    const cuts = p.offcut === 0 && p.cuts.length === 1 ? 'בשלמותה, בלי חיתוך' : summarizeCuts(p.cuts)
    lines.push(`${p.count} יח' של ${fmtM(p.unitLength)} מ' → ${cuts}${p.offcut > 0 ? ` | שארית ${fmtM(p.offcut)} מ'` : ''}`)
  }
  if (plan.steelJoints > 0) lines.push(`${plan.steelJoints} חיבורים בתושבת ברזל`)
  return lines
}

function summarizeCuts(cuts) {
  if (cuts.length === 1) return `חתיכה של ${fmtM(cuts[0])} מ'`
  const counts = {}
  cuts.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
  return Object.entries(counts).sort((a, b) => b[0] - a[0])
    .map(([len, k]) => k === 1 ? `חתיכה של ${fmtM(Number(len))} מ'` : `${k} חתיכות של ${fmtM(Number(len))} מ'`).join(' + ')
}

// אורכי המלאי של פריט במחירון: רק מה שמסומן "במלאי". אם לא הוגדר — אורך היחידה הרגיל
export function getStockLengths(mat) {
  if (!mat) return []
  const list = Array.isArray(mat.stock_lengths) ? mat.stock_lengths : []
  const inStock = list.filter(s => s && Number(s.length) > 0 && s.in_stock !== false).map(s => Number(s.length))
  if (inStock.length) return [...new Set(inStock)].sort((a, b) => a - b)
  return Number(mat.piece_length) > 0 ? [Number(mat.piece_length)] : []
}

function normalizeLengths(arr) {
  return [...new Set((arr || []).map(toCm).filter(x => x > 0))].sort((a, b) => a - b)
}

const toCm = (m) => Math.round((Number(m) || 0) * 100)
const toM = (cm) => Math.round(cm) / 100
const sumM = (arr) => Math.round(arr.reduce((s, x) => s + x, 0) * 100) / 100

// מספר לתצוגה — עד 2 ספרות אחרי הנקודה, בלי אפסים מיותרים
export function fmtM(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 })
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
