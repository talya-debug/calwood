/**
 * מנוע חישוב דק — תרגום 1:1 מאקסל אורי גזית v7
 * כל נוסחה מתורגמת ישירות מהאקסל
 */

// מחירי בסיס
const BASE_PRICES = {
  beam_52x160: 22.09,
  joist_52x105: 14.50,
  pine_board: 12,
  bamboo_dark: 38.94,
  bamboo_light: 43.66,
  ipe: 64.90,
  ipe_premium: 70.80,
  cumaru: 47.20,
  sucupira: 40.12,
  concrete: 30,
  akerstein: 3,
  tar: 162,         // דלי זפת
  oil: 400,
  hourly: 250,
  helper: 900,
  pro_worker: 1300,
  stair: 800,
}

// סוגי עץ — מידות לפי האקסל
const WOOD_TYPES = {
  pine:       { name: 'אורן', boardWidth: 0.15, boardLength: 3.6, priceKey: 'pine_board', screwType: 'pine' },
  bamboo_d:   { name: 'במבוק כהה', boardWidth: 0.142, boardLength: 1.85, priceKey: 'bamboo_dark', screwType: 'bamboo' },
  bamboo_l:   { name: 'במבוק בהיר', boardWidth: 0.142, boardLength: 1.85, priceKey: 'bamboo_light', screwType: 'bamboo' },
  ipe:        { name: 'איפאה', boardWidth: 0.15, boardLength: 3.6, priceKey: 'ipe', screwType: 'pine' },
  ipe_prem:   { name: 'איפאה פרמיום', boardWidth: 0.15, boardLength: 3.6, priceKey: 'ipe_premium', screwType: 'pine' },
  cumaru:     { name: 'קומרו', boardWidth: 0.15, boardLength: 3.6, priceKey: 'cumaru', screwType: 'pine' },
  sucupira:   { name: 'סוקופירה', boardWidth: 0.145, boardLength: 3.6, priceKey: 'sucupira', screwType: 'pine' },
}

export function calculateDeck(dims, rules, materialsList, profile) {
  const { width: W, length: L, woodType = 'pine', height = 'low',
    direction = 'horizontal', access = 'easy', helperType = 'regular',
    baseType = 'concrete', stairs = 0, supplierDiscount = 0,
    supportBeam = false, supportType = '5x15' } = dims

  const wood = WOOD_TYPES[woodType] || WOOD_TYPES.pine
  const safetyPct = profile.safety_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const MARGIN = (1 + safetyPct / 100) * (1 + profitPct / 100)
  const discount = supplierDiscount || profile.supplier_discount || 0
  const disc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100
  const hourlyRate = profile.hourly_rate ?? BASE_PRICES.hourly
  const helperDaily = profile.helper_daily ?? BASE_PRICES.helper
  const heightMidPct = 20
  const heightHighPct = 40

  // מחירים עם הנחה
  const ep_joist = disc(BASE_PRICES.joist_52x105)  // ג'ויסטים — תמיד 52x105
  const ep_beam = disc(BASE_PRICES.beam_52x160)     // תומך — 52x160
  const woodPrice = disc(BASE_PRICES[wood.priceKey]) // מחיר קרש דק

  // === כיוון פריסה — בדיוק כמו באקסל ===
  // DIM_BOARD = הממד שלאורכו הקרשים
  // DIM_JOIST = הממד שלאורכו הג'ויסטים (ניצב לקרשים)
  const DIM_BOARD = direction === 'vertical' ? L : W  // לאורך=L, לרוחב=W
  const DIM_JOIST = direction === 'vertical' ? W : L  // לאורך=W, לרוחב=L

  const area = L * W

  // === תומך תשתית — אופציונלי ===
  let supportCount = 0, supportLength = 0, supportLegs = 0
  if (supportBeam) {
    // כמות: MAX(1, CEILING(DIM_BOARD/1.5))
    supportCount = Math.max(1, Math.ceil(DIM_BOARD / 1.5))
    // אורך: DIM_JOIST
    supportLength = DIM_JOIST
    // רגליים: CEILING(supportLength/1.15) × supportCount
    supportLegs = Math.ceil(supportLength / 1.15) * supportCount
  }

  // === כתב כמויות ===

  // כמות ג'ויסטים = CEILING(DIM_BOARD / 0.4) + 1
  const joistCount = Math.ceil(DIM_BOARD / 0.4) + 1

  // רגליים לג'ויסט — אם יש תומך = 0, אחרת = CEILING(DIM_JOIST/1.15)+1
  const legsPerJoist = supportBeam ? 0 : Math.ceil(DIM_JOIST / 1.15) + 1

  // סה"כ רגליים
  const totalLegs = supportBeam ? supportLegs : joistCount * legsPerJoist

  // שורות קרשים = CEILING(DIM_JOIST / board_width)
  const boardRows = Math.ceil(DIM_JOIST / wood.boardWidth)

  // לוחות לשורה = CEILING(DIM_BOARD / board_length)
  const boardsPerRow = Math.ceil(DIM_BOARD / wood.boardLength)

  // סה"כ לוחות
  const totalBoards = boardRows * boardsPerRow

  // בטון — לפי גובה ובסיס
  let concreteBags = 0
  if (baseType === 'concrete') {
    if (height === 'mid') concreteBags = Math.ceil(totalLegs * 2.5)
    else if (height === 'high') concreteBags = Math.ceil(totalLegs * 3.5)
    // נמוך = 0
  }

  // אקרשטיין
  const akersteinCount = baseType === 'akerstein' ? totalLegs : 0

  // === חישוב עלויות — בדיוק כמו באקסל ===
  const lineItems = []

  // קרשי דק = לוחות × אורך לוח × מחיר/מ'
  const costBoards = Math.round(totalBoards * wood.boardLength * woodPrice)
  lineItems.push({ name: `קרשי דק ${wood.name}`, quantity: totalBoards, unit: 'לוחות',
    detail: `${boardRows} שורות × ${boardsPerRow} לוחות × ${wood.boardLength} מ' × ${woodPrice} ₪/מ'`,
    cost: costBoards })

  // ג'ויסטים = כמות × DIM_JOIST × מחיר joist
  const costJoists = Math.round(joistCount * DIM_JOIST * ep_joist)
  lineItems.push({ name: "ג'ויסטים (52×105)", quantity: joistCount, unit: "יח'",
    detail: `${joistCount} × ${DIM_JOIST} מ' × ${ep_joist} ₪/מ'`, cost: costJoists })

  // תומך תשתית
  let costSupport = 0
  if (supportBeam) {
    const supportPrice = supportType === '5x10' ? ep_joist : ep_beam
    costSupport = Math.round(supportCount * supportLength * supportPrice)
    lineItems.push({ name: `תומך תשתית (${supportType === '5x10' ? '52×105' : '52×160'})`,
      quantity: supportCount, unit: "יח'",
      detail: `${supportCount} × ${supportLength} מ'`, cost: costSupport })
  }

  // תוספת גובה — רק על קרשים + ג'ויסטים!
  let costHeight = 0
  if (height === 'mid') costHeight = Math.round((costBoards + costJoists) * heightMidPct / 100)
  else if (height === 'high') costHeight = Math.round((costBoards + costJoists) * heightHighPct / 100)
  if (costHeight > 0) {
    lineItems.push({ name: 'תוספת גובה', quantity: 1, unit: '',
      detail: `${height === 'mid' ? '20' : '40'}% על קרשים+ג\'ויסטים`, cost: costHeight })
  }

  // שמן
  lineItems.push({ name: 'שימון', quantity: 1, unit: 'לפרויקט', detail: '', cost: BASE_PRICES.oil })

  // זפת — CEILING(area/250) × 162
  const costTar = Math.ceil(area / 250) * BASE_PRICES.tar
  lineItems.push({ name: 'זפת', quantity: Math.ceil(area / 250), unit: 'דליים',
    detail: `${area} מ"ר / 250`, cost: costTar })

  // ברגים — לפי סוג עץ (בדיוק כמו באקסל)
  let costScrews = 0
  if (wood.screwType === 'bamboo') {
    // במבוק: CEILING(area/4.5) × 135
    costScrews = Math.ceil(area / 4.5) * 135
  } else {
    // אורן/אחר: CEILING(area×37.5×1.1/400) × 170
    costScrews = Math.ceil(area * 37.5 * 1.1 / 400) * 170
  }
  lineItems.push({ name: 'ברגים', quantity: 1, unit: '',
    detail: wood.screwType === 'bamboo' ? `${Math.ceil(area / 4.5)} חבילות במבוק` : `${Math.ceil(area * 37.5 * 1.1 / 400)} חבילות`,
    cost: costScrews })

  // בטון
  if (concreteBags > 0) {
    const costConcrete = Math.ceil(concreteBags) * BASE_PRICES.concrete
    lineItems.push({ name: 'בטון', quantity: Math.ceil(concreteBags), unit: 'שקים',
      detail: `${totalLegs} רגליים`, cost: costConcrete })
  }

  // אקרשטיין
  if (akersteinCount > 0) {
    lineItems.push({ name: 'אקרשטיין', quantity: akersteinCount, unit: "יח'",
      detail: `${akersteinCount} × 3 ₪`, cost: akersteinCount * BASE_PRICES.akerstein })
  }

  // מדרגות
  if (stairs > 0) {
    lineItems.push({ name: 'מדרגות', quantity: stairs, unit: "יח'",
      detail: `${stairs} × ${BASE_PRICES.stair} ₪`, cost: stairs * BASE_PRICES.stair })
  }

  // עבודה — MAX(2, ROUND(L×W×0.1, 1))
  const workDays = Math.max(2, Math.round(L * W * 0.1 * 10) / 10)
  const costLaborOwner = workDays * 8 * hourlyRate
  let costLaborHelper = 0
  if (helperType === 'regular') costLaborHelper = workDays * helperDaily
  else if (helperType === 'pro') costLaborHelper = workDays * BASE_PRICES.pro_worker

  // נסיעות
  const travelCost = dims.travelCost || 200

  // תוספת גישה — על (קרשים+ג'ויסטים+תומך+שמן+ברגים+בטון+אקרשטיין+עבודה)
  const accessBase = costBoards + costJoists + costSupport + BASE_PRICES.oil + costScrews +
    (concreteBags > 0 ? Math.ceil(concreteBags) * BASE_PRICES.concrete : 0) +
    akersteinCount * BASE_PRICES.akerstein + costLaborOwner + costLaborHelper
  let costAccess = 0
  if (access === 'medium') costAccess = Math.round(accessBase * 0.075)
  else if (access === 'hard') costAccess = Math.round(accessBase * 0.15)

  // תקורה 5% — על (קרשים+ג'ויסטים+תומך+שמן+ברגים+בטון+אקרשטיין+עבודה) — בלי נסיעות, בלי גישה, בלי גובה!
  const overheadBase = costBoards + costJoists + costSupport + BASE_PRICES.oil + costScrews +
    (concreteBags > 0 ? Math.ceil(concreteBags) * BASE_PRICES.concrete : 0) +
    akersteinCount * BASE_PRICES.akerstein + costLaborOwner + costLaborHelper
  const costOverhead = Math.round(overheadBase * (profile.overhead_pct ?? 5) / 100)

  // סה"כ עלויות
  const totalCosts = lineItems.reduce((s, i) => s + i.cost, 0) + costLaborOwner + costLaborHelper + travelCost + costAccess + costOverhead

  // מחיר ללקוח = עלויות × (1+ביטחון) × (1+רווח)
  const priceBeforeVat = Math.round(totalCosts * MARGIN)
  const vat = Math.round(priceBeforeVat * 0.18)
  const totalPrice = priceBeforeVat + vat
  const pricePerSqm = area > 0 ? Math.round(priceBeforeVat / area) : 0

  return {
    type: 'deck',
    dimensions: { width: W, length: L, height, woodType, direction, access, helperType, baseType, stairs, supportBeam },
    area,
    engineering: {
      joistCount, totalLegs, totalBoards, boardRows, boardsPerRow,
      DIM_BOARD, DIM_JOIST,
      supportCount, supportLength, supportLegs,
    },
    lineItems,
    labor: { days: workDays, owner: costLaborOwner, helper: costLaborHelper, total: costLaborOwner + costLaborHelper },
    travel: travelCost, accessCost: costAccess, heightCost: costHeight,
    totals: {
      materials: lineItems.reduce((s, i) => s + i.cost, 0),
      labor: costLaborOwner + costLaborHelper,
      overhead: costOverhead,
      safety: 0, profit: 0, // כלול ב-MARGIN
      totalCosts,
      beforeVat: priceBeforeVat,
      vat,
      total: totalPrice,
      pricePerSqm,
      margin: MARGIN,
    }
  }
}

export { WOOD_TYPES }
