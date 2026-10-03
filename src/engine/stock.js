/**
 * תוכנית חיתוך מאורכי מלאי — מקור אחד לכמויות, לשרטוט, למחירון ולתוכנית החיתוך
 *
 * runLength     — אורך כל ריצה שצריך (מ'), למשל אורך קורה
 * count         — כמה ריצות כאלה
 * stockLength   — אורך יחידה שהספק מוכר (מ'), מהמחירון. 0 = אין מגבלה (קונים לפי מטר)
 * spliceSpacing — מרווח בין נקודות תמיכה (מ'). אם ריצה ארוכה מהמלאי, מחברים רק על תמיכה.
 *                 null = אסור לחבר (למשל עמוד) — מזמינים יחידה באורך מיוחד
 * multiCut      — מותר לחתוך כמה חתיכות מאותה יחידה (ברירת מחדל: כן).
 *                 בלוחות דק false — כל שורה נקנית בנפרד, כמו באקסל
 *
 * כל החישוב בסנטימטרים שלמים, כדי שלא ייצאו מספרים כמו 8.399999999
 */
export function cutPlan({ runLength, count, stockLength, spliceSpacing = null, multiCut = true }) {
  const run = toCm(runLength)
  const n = Math.max(0, Math.round(Number(count) || 0))
  const stock = toCm(stockLength)
  const neededM = toM(run * n)

  const empty = { bars: n, stockLength: toM(run), purchasedM: neededM, neededM, wasteM: 0, wastePct: 0,
    runPieces: [toM(run)], patterns: [], specialLength: 0 }
  // אין אורך מלאי במחירון — קונים לפי מטר
  if (!stock || run <= 0 || n === 0) return empty

  // 1. איך בונים ריצה אחת: חתיכות שהחיבורים שלהן נופלים על תמיכה
  let runPieces
  let specialLength = 0
  if (run <= stock) {
    runPieces = [run]
  } else if (spliceSpacing) {
    const sp = toCm(spliceSpacing)
    const longest = Math.floor(stock / sp) * sp // החתיכה הארוכה ביותר שנגמרת על תמיכה
    if (longest <= 0) {
      runPieces = [run]; specialLength = run
    } else {
      runPieces = []
      let rest = run
      while (rest > stock) { runPieces.push(longest); rest -= longest }
      if (rest > 0) runPieces.push(rest)
    }
  } else {
    // אסור לחבר — צריך יחידה באורך מיוחד
    runPieces = [run]; specialLength = run
  }

  // 2. אריזת כל החתיכות ביחידות מלאי (הגדולה קודם)
  let bins = [] // כל יחידה = רשימת חתיכות
  let specialBars = 0
  const all = []
  for (let i = 0; i < n; i++) all.push(...runPieces)
  all.sort((a, b) => b - a)
  for (const p of all) {
    if (p > stock) { specialBars++; continue }
    const bin = multiCut ? bins.find(b => stock - sum(b) >= p) : null
    if (bin) bin.push(p)
    else bins.push([p])
  }

  // 3. סיכום
  const purchasedCm = bins.length * stock + specialBars * specialLength
  const wasteCm = purchasedCm - run * n
  const patterns = groupPatterns(bins, stock)
  if (specialBars > 0) patterns.push({ count: specialBars, unitLength: toM(specialLength), cuts: [toM(specialLength)], offcut: 0, special: true })

  return {
    bars: bins.length + specialBars,
    stockLength: toM(stock),
    purchasedM: toM(purchasedCm),
    neededM,
    wasteM: toM(wasteCm),
    wastePct: purchasedCm > 0 ? Math.round((wasteCm / purchasedCm) * 100) : 0,
    runPieces: runPieces.map(toM),
    patterns,
    specialLength: toM(specialLength),
  }
}

// מקבץ יחידות עם אותו דפוס חיתוך: "8 יח' — חתיכה של 4 מ'"
function groupPatterns(bins, stock) {
  const map = new Map()
  for (const b of bins) {
    const key = [...b].sort((x, y) => y - x).join('+')
    const g = map.get(key) || { count: 0, unitLength: toM(stock), cuts: [...b].sort((x, y) => y - x).map(toM), offcut: toM(stock - sum(b)) }
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
    lines.push(`כל ${itemName} באורך ${fmtM(sumM(plan.runPieces))} מ' = ${plan.runPieces.map(fmtM).join(' + ')} מ' (החיבור על תמיכה)`)
  }
  for (const p of plan.patterns) {
    if (p.special) {
      lines.push(`${p.count} יח' באורך מיוחד ${fmtM(p.unitLength)} מ' — ארוך מהמלאי במחירון (${fmtM(plan.stockLength)} מ'), להזמין מהספק`)
      continue
    }
    const cuts = p.offcut === 0 && p.cuts.length === 1 ? 'בשלמותה, בלי חיתוך' : summarizeCuts(p.cuts)
    lines.push(`${p.count} יח' של ${fmtM(p.unitLength)} מ' → ${cuts}${p.offcut > 0 ? ` | שארית ${fmtM(p.offcut)} מ'` : ''}`)
  }
  return lines
}

function summarizeCuts(cuts) {
  if (cuts.length === 1) return `חתיכה של ${fmtM(cuts[0])} מ'`
  const counts = {}
  cuts.forEach(c => { counts[c] = (counts[c] || 0) + 1 })
  return Object.entries(counts).map(([len, k]) => `${k} חתיכות של ${fmtM(Number(len))} מ'`).join(' + ')
}

const toCm = (m) => Math.round((Number(m) || 0) * 100)
const toM = (cm) => Math.round(cm) / 100
const sum = (arr) => arr.reduce((s, x) => s + x, 0)
const sumM = (arr) => Math.round(arr.reduce((s, x) => s + x, 0) * 100) / 100

// מספר לתצוגה — עד 2 ספרות אחרי הנקודה, בלי אפסים מיותרים
export function fmtM(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 })
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
