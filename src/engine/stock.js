/**
 * חישוב יחידות מלאי ופחת — מקור אחד לכמויות, לשרטוט ולמחירון
 *
 * runLength  — אורך כל ריצה שצריך (מ'), למשל אורך קורת תשתית
 * count      — כמה ריצות כאלה
 * stockLength — אורך יחידה שהספק מוכר (מ'), מהמחירון. 0 = אין מגבלה (קונים לפי מטר)
 * reuseOffcuts — האם מותר לנצל שאריות לחיבור (קורות תשתית: כן, על רגל. לוחות דק: לא — כמו באקסל)
 * minPiece   — אורך מינימלי לחתיכת השלמה (למשל מרווח רגליים, כדי שהחיבור ייפול על תמיכה)
 */
export function cutPlan({ runLength, count, stockLength, reuseOffcuts = false, minPiece = 0 }) {
  const run = Number(runLength) || 0
  const n = Math.max(0, Math.round(Number(count) || 0))
  const stock = Number(stockLength) || 0
  const neededM = round2(run * n)

  // אין אורך מלאי במחירון — קונים בדיוק לפי מטר
  if (!stock || run <= 0 || n === 0) {
    return { bars: n, stockLength: run, purchasedM: neededM, neededM, wasteM: 0, wastePct: 0 }
  }

  let bars
  if (run <= stock + 1e-9) {
    // כמה ריצות נכנסות ביחידה אחת
    const perBar = reuseOffcuts ? Math.max(1, Math.floor((stock + 1e-9) / run)) : 1
    bars = Math.ceil(n / perBar)
  } else {
    const full = Math.floor((run + 1e-9) / stock)
    const rest = round2(run - full * stock)
    if (rest <= 0.001) {
      bars = full * n
    } else if (!reuseOffcuts) {
      bars = (full + 1) * n
    } else {
      // חתיכת השלמה — לפחות minPiece, ומנצלים כמה חתיכות מכל יחידה
      const piece = Math.min(stock, Math.max(rest, minPiece))
      const perBar = Math.max(1, Math.floor((stock + 1e-9) / piece))
      bars = full * n + Math.ceil(n / perBar)
    }
  }

  const purchasedM = round2(bars * stock)
  const wasteM = round2(purchasedM - neededM)
  const wastePct = purchasedM > 0 ? Math.round((wasteM / purchasedM) * 100) : 0
  return { bars, stockLength: stock, purchasedM, neededM, wasteM, wastePct }
}

export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
