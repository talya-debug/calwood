/**
 * מנוע חישוב דק
 * הלוגיקה: מידות → חישוב הנדסי (מ' ריצה) → מידות הספק (כמה יחידות) → מחיר
 */
import { getBeamPrice } from './engineering'
import { getMaterials } from '../utils/storage'

// סוגי עץ — matId מפנה למחירון
const WOOD_TYPES = {
  pine:       { name: 'אורן', matId: 10, screwPack: 'pine' },
  bamboo_d:   { name: 'במבוק כהה', matId: 11, screwPack: 'bamboo' },
  bamboo_l:   { name: 'במבוק בהיר', matId: 12, screwPack: 'bamboo' },
  ipe:        { name: 'איפאה', matId: 13, screwPack: 'pine' },
  ipe_prem:   { name: 'איפאה פרמיום', matId: 14, screwPack: 'pine' },
  cumaru:     { name: 'קומרו', matId: 15, screwPack: 'pine' },
  sucupira:   { name: 'סוקופירה', matId: 16, screwPack: 'pine' },
}

export function calculateDeck(dims, rules, materialsList, profile) {
  const { width, length, woodType = 'pine', height = 'low', direction = 'horizontal',
    access = 'easy', helperType = 'regular', baseType = 'concrete',
    stairs = 0, supplierDiscount = 0, supportBeam = false } = dims

  const area = width * length
  const wood = WOOD_TYPES[woodType] || WOOD_TYPES.pine
  const discount = supplierDiscount || profile.supplier_discount || 0
  const applyDisc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100
  const materials = getMaterials()

  // שליפת מידות מהמחירון — הקבלן מגדיר לפי הספק שלו
  const boardMat = getMat(materials, wood.matId)
  const boardPieceLen = boardMat.piece_length || 3.6 // אורך לוח מהספק
  const boardWidthCm = (boardMat.board_width || boardMat.width || 15) / 100 // רוחב נטו במטרים

  const joistSpacing = 0.40
  const screwsPerSqm = 37.5
  const screwsExtra = 10
  const workDaysPerSqm = 0.1
  const tarCoverage = getMat(materials, 41).coverage || 250
  const overheadPct = profile.overhead_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const safetyPct = profile.safety_pct ?? 5
  const vatPct = 18

  // כיוון פריסה
  const boardRunLength = direction === 'horizontal' ? width : length
  const joistRunLength = direction === 'horizontal' ? length : width
  const boardSpanLength = direction === 'horizontal' ? length : width

  // === חישוב הנדסי — כמויות ===

  // ג'ויסטים
  const joistCount = Math.floor(boardSpanLength / joistSpacing) + 1

  // קרשי דק — כמה לוחות פיזיים
  const boardsPerRow = Math.ceil(boardRunLength / boardPieceLen) // כמה לוחות ברוח��
  const rowCount = Math.ceil(boardSpanLength / boardWidthCm) // כמה שורו��
  const totalBoards = boardsPerRow * rowCount
  const totalBoardMeters = totalBoards * boardPieceLen // סה"כ מ' ריצ��

  // מחירים מהמחירון
  const boardPrice = applyDisc(boardMat.price_per_unit)
  const joistMat = getBeamMat(materials, '5x10')
  const joistPieceLen = joistMat.piece_length || 4
  const joistPrice = applyDisc(joistMat.price_per_unit)

  const lineItems = []

  // קרשי דק
  lineItems.push({
    name: `קרשי דק ${wood.name}`,
    quantity: totalBoards, unit: 'לוחות',
    detail: `${rowCount} שורות x ${boardsPerRow} לוחות של ${boardPieceLen} מ' = ${round(totalBoardMeters)} מ' ריצה`,
    runningMeters: round(totalBoardMeters),
    cost: round(totalBoardMeters * boardPrice)
  })

  // ג'ויסטים
  const joistMetersTotal = joistCount * joistRunLength
  const joistPieces = Math.ceil(joistMetersTotal / joistPieceLen)
  lineItems.push({
    name: "ג'ויסטים",
    quantity: joistPieces, unit: "יח'",
    detail: `${joistCount} x ${joistRunLength} מ' = ${round(joistMetersTotal)} מ' ריצה → ${joistPieces} יח' של ${joistPieceLen} מ'`,
    runningMeters: round(joistMetersTotal),
    cost: round(joistMetersTotal * joistPrice)
  })

  // תומך תשתית
  if (supportBeam) {
    const supportCount = Math.max(1, Math.ceil(boardRunLength / 1.5))
    const supportMat = getBeamMat(materials, '5x15')
    const supportPieceLen = supportMat.piece_length || 4
    const supportMeters = supportCount * joistRunLength
    const supportPieces = Math.ceil(supportMeters / supportPieceLen)
    lineItems.push({
      name: 'תומכי תשתית',
      quantity: supportPieces, unit: "יח'",
      detail: `${supportCount} x ${joistRunLength} מ' = ${round(supportMeters)} מ' ריצה → ${supportPieces} יח' של ${supportPieceLen} מ'`,
      runningMeters: round(supportMeters),
      cost: round(supportMeters * applyDisc(supportMat.price_per_unit))
    })
  }

  // ברגים
  const totalScrews = Math.ceil(area * screwsPerSqm * (1 + screwsExtra / 100))
  const isBamboo = wood.screwPack === 'bamboo'
  const screwMat = getMat(materials, isBamboo ? 32 : 31)
  const screwPackSize = screwMat.pack_size || (isBamboo ? 80 : 400)
  const screwPacks = Math.ceil(totalScrews / screwPackSize)
  lineItems.push({
    name: 'ברגים', quantity: screwPacks, unit: 'חבילות',
    detail: `${totalScrews} ברגים → ${screwPacks} חבילות`,
    cost: round(screwPacks * screwMat.price_per_unit)
  })

  // זפת
  const tarUnits = Math.ceil(area / tarCoverage * 10) / 10
  if (tarUnits > 0) {
    lineItems.push({ name: 'זפת', quantity: Math.ceil(tarUnits), unit: 'דליים',
      detail: `${area} מ"ר / ${tarCoverage} כיסוי`,
      cost: round(Math.ceil(tarUnits) * getMat(materials, 41).price_per_unit) })
  }

  // בסיס רגליים
  const footingCount = joistCount * 2
  if (baseType === 'concrete') {
    const bagsPerFoot = height === 'low' ? 0 : height === 'mid' ? 2.5 : 3.5
    const totalBags = Math.ceil(footingCount * bagsPerFoot)
    if (totalBags > 0) {
      lineItems.push({ name: 'שקי בטון', quantity: totalBags, unit: 'שקים',
        detail: `${footingCount} רגליים x ${bagsPerFoot} שקים`,
        cost: round(totalBags * getMat(materials, 50).price_per_unit) })
    }
  } else if (baseType === 'akerstein') {
    lineItems.push({ name: 'אקרשטיין', quantity: footingCount, unit: "יח'",
      detail: '', cost: round(footingCount * getMat(materials, 51).price_per_unit) })
  }

  // שמן
  lineItems.push({ name: 'שמן/שימון', quantity: 1, unit: 'לפרויקט', detail: '',
    cost: getMat(materials, 40).price_per_unit })

  // מדר��ות
  if (stairs > 0) {
    lineItems.push({ name: 'מדרגות', quantity: stairs, unit: "יח'",
      detail: '', cost: round(stairs * getMat(materials, 80).price_per_unit) })
  }

  const totalMaterials = lineItems.reduce((sum, item) => sum + item.cost, 0)

  // עבודה
  const workDays = Math.max(2, round(area * workDaysPerSqm * 10) / 10)
  const laborOwner = workDays * (profile.hourly_rate ?? 250) * 8
  let helperDaily = 0, helperDays = 0
  if (helperType === 'regular') { helperDaily = profile.helper_daily ?? 900; helperDays = workDays }
  else if (helperType === 'pro') { helperDaily = 1300; helperDays = workDays }
  const laborHelper = helperDays * helperDaily
  const totalLabor = round(laborOwner + laborHelper)

  const travelCost = dims.travelCost || 200
  const accessPct = access === 'medium' ? 7.5 : access === 'hard' ? 15 : 0
  const accessCost = round((totalMaterials + totalLabor) * accessPct / 100)
  const heightPct = height === 'mid' ? 20 : height === 'high' ? 40 : 0
  const heightCost = round((totalMaterials + totalLabor) * heightPct / 100)

  const subtotal = totalMaterials + totalLabor + travelCost + accessCost + heightCost
  const totalOverhead = round(subtotal * (overheadPct / 100))
  const afterOverhead = subtotal + totalOverhead
  const totalSafety = round(afterOverhead * (safetyPct / 100))
  const totalProfit = round((afterOverhead + totalSafety) * (profitPct / 100))
  const totalBeforeVat = round(afterOverhead + totalSafety + totalProfit)
  const vat = round(totalBeforeVat * (vatPct / 100))
  const totalPrice = round(totalBeforeVat + vat)
  const pricePerSqm = area > 0 ? round(totalBeforeVat / area) : 0

  return {
    type: 'deck',
    dimensions: { width, length, height, woodType, direction, access, helperType, baseType, stairs, supportBeam },
    area, lineItems, travel: travelCost, accessCost, heightCost,
    labor: { days: workDays, owner: round(laborOwner), helper: round(laborHelper), total: totalLabor },
    totals: { materials: totalMaterials, labor: totalLabor, overhead: totalOverhead, safety: totalSafety,
      profit: totalProfit, beforeVat: totalBeforeVat, vat, total: totalPrice, pricePerSqm }
  }
}

// ברירות מחדל לפי ID — אם חומר לא נמצא במחירון
const DEFAULTS = {
  10: { price_per_unit: 12, piece_length: 3.6, width: 16 },
  11: { price_per_unit: 38.94, piece_length: 1.85, width: 13.7 },
  12: { price_per_unit: 43.66, piece_length: 1.85, width: 13.7 },
  13: { price_per_unit: 64.90, piece_length: 2.2, width: 15 },
  14: { price_per_unit: 70.80, piece_length: 2.2, width: 15 },
  15: { price_per_unit: 47.20, piece_length: 2.2, width: 15 },
  16: { price_per_unit: 40.12, piece_length: 2.2, width: 14 },
  3: { price_per_unit: 14.50, piece_length: 4 },
  4: { price_per_unit: 22.09, piece_length: 4 },
  31: { price_per_unit: 170, pack_size: 400 },
  32: { price_per_unit: 135, pack_size: 80 },
  40: { price_per_unit: 400 },
  41: { price_per_unit: 162, coverage: 250 },
  50: { price_per_unit: 30 },
  51: { price_per_unit: 3 },
  80: { price_per_unit: 800 },
}

function getMat(materials, id) {
  const found = materials.find(m => m.id === id && m.is_active)
  if (found) return found
  const def = DEFAULTS[id]
  return def ? { ...def, id, is_active: true } : { price_per_unit: 0, piece_length: 0, pack_size: 0, coverage: 0 }
}

function getBeamMat(materials, section) {
  const beamIds = { '5x10': 3, '5x15': 4, '5x20': 5, '7x20': 6, '10x25': 7 }
  return getMat(materials, beamIds[section] || 3)
}

function round(n) { return Math.round(n) }

export { WOOD_TYPES }
