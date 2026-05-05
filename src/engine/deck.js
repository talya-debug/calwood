/**
 * מנוע חישוב דק — נוסחאות 1:1 מאקסל + מחירים ומידות מהמחירון של הקבלן
 */
import { getMaterials } from '../utils/storage'

// ברירות מחדל — רק אם הקבלן לא שינה
const DEFAULTS = {
  joist: { id: 3, price: 14.50 },    // 52x105
  beam: { id: 4, price: 22.09 },     // 52x160
  concrete: { id: 50, price: 30 },
  akerstein: { id: 51, price: 3 },
  oil: { id: 40, price: 400 },
  tar: { id: 41, price: 162 },
  stair: { id: 80, price: 800 },
  screws_pine: { id: 31, price: 170 },
  screws_bamboo: { id: 32, price: 135 },
}

// סוגי עץ — matId מפנה למחירון, ברירות מחדל למידות
const WOOD_TYPES = {
  pine:       { name: 'אורן', matId: 10, defaultPrice: 12, defaultBoardWidth: 0.15, defaultBoardLength: 3.6, screwType: 'pine' },
  bamboo_d:   { name: 'במבוק כהה', matId: 11, defaultPrice: 38.94, defaultBoardWidth: 0.142, defaultBoardLength: 1.85, screwType: 'bamboo' },
  bamboo_l:   { name: 'במבוק בהיר', matId: 12, defaultPrice: 43.66, defaultBoardWidth: 0.142, defaultBoardLength: 1.85, screwType: 'bamboo' },
  ipe:        { name: 'איפאה', matId: 13, defaultPrice: 64.90, defaultBoardWidth: 0.15, defaultBoardLength: 3.6, screwType: 'pine' },
  ipe_prem:   { name: 'איפאה פרמיום', matId: 14, defaultPrice: 70.80, defaultBoardWidth: 0.15, defaultBoardLength: 3.6, screwType: 'pine' },
  cumaru:     { name: 'קומרו', matId: 15, defaultPrice: 47.20, defaultBoardWidth: 0.15, defaultBoardLength: 3.6, screwType: 'pine' },
  sucupira:   { name: 'סוקופירה', matId: 16, defaultPrice: 40.12, defaultBoardWidth: 0.145, defaultBoardLength: 3.6, screwType: 'pine' },
}

function getPrice(materials, key) {
  const def = DEFAULTS[key]
  if (!def) return 0
  const mat = materials.find(m => m.id === def.id && m.is_active)
  return mat ? Number(mat.price_per_unit) : def.price
}

// שולף מחיר + מידות של לוח דק מהמחירון
function getBoardData(materials, wood) {
  const mat = materials.find(m => m.id === wood.matId && m.is_active)
  if (mat) {
    return {
      price: Number(mat.price_per_unit) || wood.defaultPrice,
      // רוחב לוח — אם הקבלן שינה width במחירון (בס"מ), ממיר למטר
      boardWidth: mat.width ? mat.width / 100 : wood.defaultBoardWidth,
      // אורך לוח — אם הקבלן שינה piece_length במחירון
      boardLength: mat.piece_length || wood.defaultBoardLength,
    }
  }
  return { price: wood.defaultPrice, boardWidth: wood.defaultBoardWidth, boardLength: wood.defaultBoardLength }
}

export function calculateDeck(dims, rules, materialsList, profile) {
  const { width: W, length: L, woodType = 'pine', height = 'low',
    direction = 'horizontal', access = 'easy', helperType = 'regular',
    baseType = 'concrete', stairs = 0, supplierDiscount = 0,
    supportBeam = false, supportType = '5x15' } = dims

  const wood = WOOD_TYPES[woodType] || WOOD_TYPES.pine
  const materials = getMaterials()
  const board = getBoardData(materials, wood)

  const safetyPct = profile.safety_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const MARGIN = (1 + safetyPct / 100) * (1 + profitPct / 100)
  const discount = supplierDiscount || profile.supplier_discount || 0
  const disc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100
  const hourlyRate = profile.hourly_rate ?? 250
  const helperDaily = profile.helper_daily ?? 900

  // מחירים מהמחירון
  const ep_joist = disc(getPrice(materials, 'joist'))
  const ep_beam = disc(getPrice(materials, 'beam'))
  const woodPrice = disc(board.price)

  // כיוון פריסה — בדיוק כמו באקסל
  const DIM_BOARD = direction === 'vertical' ? L : W
  const DIM_JOIST = direction === 'vertical' ? W : L
  const area = L * W

  // תומך תשתית
  let supportCount = 0, supportLength = 0, supportLegs = 0
  if (supportBeam) {
    supportCount = Math.max(1, Math.ceil(DIM_BOARD / 1.5))
    supportLength = DIM_JOIST
    supportLegs = Math.ceil(supportLength / 1.15) * supportCount
  }

  // כמויות — מהמידות של הקבלן!
  const joistCount = Math.ceil(DIM_BOARD / 0.4) + 1
  const legsPerJoist = supportBeam ? 0 : Math.ceil(DIM_JOIST / 1.15) + 1
  const totalLegs = supportBeam ? supportLegs : joistCount * legsPerJoist

  // קרשים — מהמידות שהקבלן הגדיר במחירון
  const boardRows = Math.ceil(DIM_JOIST / board.boardWidth)
  const boardsPerRow = Math.ceil(DIM_BOARD / board.boardLength)
  const totalBoards = boardRows * boardsPerRow

  // בטון
  let concreteBags = 0
  if (baseType === 'concrete') {
    if (height === 'mid') concreteBags = Math.ceil(totalLegs * 2.5)
    else if (height === 'high') concreteBags = Math.ceil(totalLegs * 3.5)
  }
  const akersteinCount = baseType === 'akerstein' ? totalLegs : 0

  // === עלויות ===
  const lineItems = []

  // קרשים = לוחות × אורך לוח × מחיר/מ'
  const costBoards = Math.round(totalBoards * board.boardLength * woodPrice)
  lineItems.push({ name: `קרשי דק ${wood.name}`, quantity: totalBoards, unit: 'לוחות',
    detail: `${boardRows} שורות × ${boardsPerRow} לוחות של ${board.boardLength} מ'`, cost: costBoards })

  // ג'ויסטים
  const costJoists = Math.round(joistCount * DIM_JOIST * ep_joist)
  lineItems.push({ name: "ג'ויסטים", quantity: joistCount, unit: "יח'",
    detail: `${joistCount} × ${DIM_JOIST} מ' × ${ep_joist} ₪/מ'`, cost: costJoists })

  // תומך
  let costSupport = 0
  if (supportBeam) {
    const supportPrice = supportType === '5x10' ? ep_joist : ep_beam
    costSupport = Math.round(supportCount * supportLength * supportPrice)
    lineItems.push({ name: 'תומך תשתית', quantity: supportCount, unit: "יח'",
      detail: `${supportCount} × ${supportLength} מ'`, cost: costSupport })
  }

  // תוספת גובה — רק על קרשים+ג'ויסטים
  let costHeight = 0
  if (height === 'mid') costHeight = Math.round((costBoards + costJoists) * 20 / 100)
  else if (height === 'high') costHeight = Math.round((costBoards + costJoists) * 40 / 100)
  if (costHeight > 0) {
    lineItems.push({ name: 'תוספת גובה', quantity: 1, unit: '',
      detail: `${height === 'mid' ? '20' : '40'}%`, cost: costHeight })
  }

  // שמן
  lineItems.push({ name: 'שימון', quantity: 1, unit: '', detail: '', cost: getPrice(materials, 'oil') })

  // זפת
  const tarPrice = getPrice(materials, 'tar')
  const costTar = Math.ceil(area / 250) * tarPrice
  lineItems.push({ name: 'זפת', quantity: Math.ceil(area / 250), unit: 'דליים', detail: '', cost: costTar })

  // ברגים
  let costScrews = 0
  if (wood.screwType === 'bamboo') {
    costScrews = Math.ceil(area / 4.5) * getPrice(materials, 'screws_bamboo')
  } else {
    costScrews = Math.ceil(area * 37.5 * 1.1 / 400) * getPrice(materials, 'screws_pine')
  }
  lineItems.push({ name: 'ברגים', quantity: 1, unit: '', detail: '', cost: costScrews })

  // בטון
  if (concreteBags > 0) {
    lineItems.push({ name: 'בטון', quantity: Math.ceil(concreteBags), unit: 'שקים',
      detail: `${totalLegs} רגליים`, cost: Math.ceil(concreteBags) * getPrice(materials, 'concrete') })
  }

  // אקרשטיין
  if (akersteinCount > 0) {
    lineItems.push({ name: 'אקרשטיין', quantity: akersteinCount, unit: "יח'",
      detail: '', cost: akersteinCount * getPrice(materials, 'akerstein') })
  }

  // מדרגות
  if (stairs > 0) {
    lineItems.push({ name: 'מדרגות', quantity: stairs, unit: "יח'",
      detail: '', cost: stairs * getPrice(materials, 'stair') })
  }

  // עבודה
  const workDays = Math.max(2, Math.round(L * W * 0.1 * 10) / 10)
  const costLaborOwner = workDays * 8 * hourlyRate
  let costLaborHelper = 0
  if (helperType === 'regular') costLaborHelper = workDays * helperDaily
  else if (helperType === 'pro') costLaborHelper = workDays * 1300

  const travelCost = dims.travelCost || 200

  // גישה
  const accessBase = costBoards + costJoists + costSupport + getPrice(materials, 'oil') + costScrews +
    (concreteBags > 0 ? Math.ceil(concreteBags) * getPrice(materials, 'concrete') : 0) +
    akersteinCount * getPrice(materials, 'akerstein') + costLaborOwner + costLaborHelper
  let costAccess = 0
  if (access === 'medium') costAccess = Math.round(accessBase * 0.075)
  else if (access === 'hard') costAccess = Math.round(accessBase * 0.15)

  // תקורה
  const costOverhead = Math.round(accessBase * (profile.overhead_pct ?? 5) / 100)

  const totalCosts = lineItems.reduce((s, i) => s + i.cost, 0) + costLaborOwner + costLaborHelper + travelCost + costAccess + costOverhead
  const priceBeforeVat = Math.round(totalCosts * MARGIN)
  const vat = Math.round(priceBeforeVat * 0.18)
  const totalPrice = priceBeforeVat + vat
  const pricePerSqm = area > 0 ? Math.round(priceBeforeVat / area) : 0

  return {
    type: 'deck',
    dimensions: { width: W, length: L, height, woodType, direction, access, helperType, baseType, stairs, supportBeam },
    area,
    engineering: { joistCount, totalLegs, totalBoards, boardRows, boardsPerRow, DIM_BOARD, DIM_JOIST },
    lineItems,
    labor: { days: workDays, owner: costLaborOwner, helper: costLaborHelper, total: costLaborOwner + costLaborHelper },
    travel: travelCost, accessCost: costAccess, heightCost: costHeight,
    totals: {
      materials: lineItems.reduce((s, i) => s + i.cost, 0),
      labor: costLaborOwner + costLaborHelper,
      overhead: costOverhead,
      totalCosts, beforeVat: priceBeforeVat, vat, total: totalPrice, pricePerSqm, margin: MARGIN,
    }
  }
}

export { WOOD_TYPES }
