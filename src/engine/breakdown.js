/**
 * "איך הגענו למחיר" — פירוק המחיר לשלבים, מתוך אותם מספרים שהמנוע חישב
 * kind: 'item' = שורה רגילה, 'subtotal' = סיכום ביניים, 'total' = סה"כ
 */
/**
 * מחיר למ"ר שהקבלן קבע בהצעה (לפני מע"מ). ריק = המחיר המחושב.
 * המחיר הכולל = שטח × מחיר למ"ר. ההפרש מהמחושב מופיע כשורה נפרדת ב"איך הגענו למחיר".
 * מחיר השוק לייחוס בלבד — לא נאכף.
 */
export function applyPricePerSqm(result, override, marketPrice) {
  const t = result.totals
  t.calculatedPricePerSqm = t.pricePerSqm
  t.calculatedBeforeVat = t.beforeVat
  t.marketPricePerSqm = Number(marketPrice) > 0 ? Number(marketPrice) : null
  const p = Number(override)
  if (!(override !== '' && override !== null && override !== undefined && p > 0 && result.area > 0)) {
    t.priceAdjustment = 0
    return result
  }
  const beforeVat = Math.round(result.area * p)
  t.priceAdjustment = beforeVat - t.calculatedBeforeVat
  t.beforeVat = beforeVat
  t.vat = Math.round(beforeVat * 0.18)
  t.total = beforeVat + t.vat
  t.pricePerSqm = Math.round(p * 100) / 100
  t.manualPrice = true

  // מעדכנים את הפירוק: שורת התאמה לפני "מחיר לפני מע"מ", ואת סיכומי הסוף
  const rows = result.breakdown || []
  const i = rows.findIndex(r => r.label === 'מחיר לפני מע"מ')
  if (i >= 0) {
    rows.splice(i, 0, { kind: 'item', label: 'התאמה ידנית למחיר למ"ר', amount: t.priceAdjustment,
      note: `מחושב ${t.calculatedPricePerSqm.toLocaleString('he-IL')} ₪/מ"ר → נקבע ${t.pricePerSqm.toLocaleString('he-IL')} ₪/מ"ר` })
    rows[i + 1].amount = t.beforeVat
  }
  const vatRow = rows.find(r => r.label === 'מע"מ (18%)'); if (vatRow) vatRow.amount = t.vat
  const totalRow = rows.find(r => r.kind === 'total'); if (totalRow) totalRow.amount = t.total
  return result
}

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
