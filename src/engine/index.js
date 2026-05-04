/**
 * מנוע חישוב ראשי — WoodCalc / Timber Logic
 * מרכז את כל סוגי החישוב
 */

export { calculatePergola } from './pergola'
export { calculateDeck, WOOD_TYPES } from './deck'

/**
 * חישוב עבודה מותאמת (לפי סוג עבודה שהקבלן הגדיר)
 * @param {object} workType - סוג העבודה מה-DB
 * @param {number} quantity - כמות (מ"ר / מ' / יחידות / שעות)
 * @param {object} profile - פרופיל קבלן
 * @param {object} rules - כללי חישוב
 */
export function calculateCustom(workType, quantity, profile, rules) {
  const pricePerUnit = Number(workType.default_price_per_unit) || 0
  const daysPerUnit = Number(workType.default_days_per_unit) || 1

  const unitLabel = {
    sqm: 'מ"ר',
    linear_m: 'מ׳',
    unit: 'יח׳',
    hours: 'שעות'
  }[workType.calc_method] || 'יח׳'

  // חומרים מתבנית
  const lineItems = []

  if (pricePerUnit > 0) {
    lineItems.push({
      name: `חומרים — ${workType.name}`,
      quantity,
      unit: unitLabel,
      detail: `${quantity} ${unitLabel} × ${pricePerUnit} ₪`,
      cost: Math.round(quantity * pricePerUnit)
    })
  }

  // חומרים נלווים מהתבנית
  const templateMaterials = workType.materials_template || []
  for (const mat of templateMaterials) {
    lineItems.push({
      name: mat.name,
      quantity: mat.quantity * quantity,
      unit: mat.unit || 'יח׳',
      detail: '',
      cost: Math.round(mat.price * mat.quantity * quantity)
    })
  }

  const totalMaterials = lineItems.reduce((sum, item) => sum + item.cost, 0)

  // עבודה
  const workDays = Math.round(quantity * daysPerUnit * 10) / 10
  const laborOwner = workDays * (profile.hourly_rate ?? 250) * 8
  const laborHelper = workDays * (profile.helper_daily ?? 900)
  const totalLabor = Math.round(laborOwner + laborHelper)

  // תקורה ורווח
  const overheadPct = profile.overhead_pct ?? 15
  const profitPct = profile.profit_pct ?? 25
  const vatPct = 18

  const subtotal = totalMaterials + totalLabor
  const totalOverhead = Math.round(subtotal * (overheadPct / 100))
  const totalProfit = Math.round((subtotal + totalOverhead) * (profitPct / 100))
  const totalBeforeVat = Math.round(subtotal + totalOverhead + totalProfit)
  const vat = Math.round(totalBeforeVat * (vatPct / 100))
  const totalPrice = Math.round(totalBeforeVat + vat)

  return {
    type: 'custom',
    workTypeName: workType.name,
    quantity,
    lineItems,
    labor: {
      days: workDays,
      owner: Math.round(laborOwner),
      helper: Math.round(laborHelper),
      total: totalLabor
    },
    totals: {
      materials: totalMaterials,
      labor: totalLabor,
      overhead: totalOverhead,
      profit: totalProfit,
      beforeVat: totalBeforeVat,
      vat,
      total: totalPrice
    }
  }
}
