/**
 * "איך הגענו למחיר" — פירוק המחיר לשלבים, מתוך אותם מספרים שהמנוע חישב
 * kind: 'item' = שורה רגילה, 'subtotal' = סיכום ביניים, 'total' = סה"כ
 */
export function buildBreakdown({ lineItems, totals, travel = 0, accessCost = 0, heightCost = 0,
  safetyPct = 0, profitPct = 0, overheadPct = 0 }) {
  const waste = lineItems.reduce((s, i) => s + (i.wasteCost || 0), 0)
  const materialsOnly = totals.materials - heightCost
  const safetyAmt = Math.round(totals.totalCosts * safetyPct / 100)
  // הרווח מחושב על העלות + מרווח הביטחון; ההפרש מעוגל כדי שהסכום יתאים בדיוק
  const profitAmt = totals.beforeVat - totals.totalCosts - safetyAmt

  const rows = [
    { kind: 'item', label: 'חומרים', amount: materialsOnly, note: waste > 0 ? `כולל פחת חיתוך בשווי ${waste.toLocaleString('he-IL')} ₪` : '' },
  ]
  if (heightCost > 0) rows.push({ kind: 'item', label: 'תוספת גובה', amount: heightCost, note: '' })
  rows.push({ kind: 'item', label: 'עבודה', amount: totals.labor, note: '' })
  if (travel > 0) rows.push({ kind: 'item', label: 'נסיעות', amount: travel, note: '' })
  if (accessCost > 0) rows.push({ kind: 'item', label: 'תוספת גישה', amount: accessCost, note: '' })
  rows.push({ kind: 'item', label: `תקורה (${overheadPct}%)`, amount: totals.overhead, note: 'רכב, כלים, ביטוח' })
  rows.push({ kind: 'subtotal', label: 'עלות כוללת', amount: totals.totalCosts, note: '' })
  rows.push({ kind: 'item', label: `מרווח ביטחון (${safetyPct}%)`, amount: safetyAmt, note: 'כרית לחריגות' })
  rows.push({ kind: 'item', label: `רווח (${profitPct}%)`, amount: profitAmt, note: '' })
  rows.push({ kind: 'subtotal', label: 'מחיר לפני מע"מ', amount: totals.beforeVat, note: '' })
  rows.push({ kind: 'item', label: 'מע"מ (18%)', amount: totals.vat, note: '' })
  rows.push({ kind: 'total', label: 'סה"כ כולל מע"מ', amount: totals.total, note: '' })
  return rows
}
