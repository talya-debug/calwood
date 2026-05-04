/**
 * מנוע חישוב פרגולה
 *
 * הלוגיקה: המידות → חישוב הנדסי (כמה מ' ריצה) → מידות הספק (כמה יחידות) → מחיר
 * הקבלן מגדיר במחירון: מידות + מחיר + אורך יחידה מהספק
 */
import { getBaseBeamSection, getSupportSection, getBeamPrice, ROOF_BEAM_SPACING, MAX_POST_SPAN } from './engineering'
import { getMaterials } from '../utils/storage'

export function calculatePergola(dims, rules, materialsList, profile) {
  const { width, length, height = 3, postSize = '15x15', attachType = 'wall',
    roofType = 'none', access = 'easy', helperType = 'regular',
    supplierDiscount = 0 } = dims

  const overheadPct = profile.overhead_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const safetyPct = profile.safety_pct ?? 5
  const vatPct = 18
  const discount = supplierDiscount || profile.supplier_discount || 0
  const applyDisc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100

  const materials = getMaterials()

  // === הנדסה — המידות קובעות חתכים וכמויות ===
  const roofWeight = (roofType === 'bh' || roofType === 'thermo') ? 'heavy' : 'light'
  const baseBeam = getBaseBeamSection(length, 0.75, roofWeight)
  const support = getSupportSection(width, length)

  // כמות עמודים
  let postCount
  if (attachType === 'wall') {
    postCount = Math.ceil(length / MAX_POST_SPAN) + 1
  } else {
    postCount = (Math.ceil(width / MAX_POST_SPAN) + 1) * (Math.ceil(length / MAX_POST_SPAN) + 1)
  }

  const baseBeamCount = Math.ceil(width / 0.75) + 1
  const roofBeamCount = Math.ceil(length / ROOF_BEAM_SPACING) + 1
  const supportCount = Math.ceil(length / MAX_POST_SPAN) + 1
  const area = width * length

  const lineItems = []

  // === עמודים ===
  const postMat = getMat(materials, postSize === '20x20' ? 2 : 1)
  const postMetersTotal = postCount * height
  const postPieceLen = postMat.piece_length || 3
  const postPieces = Math.ceil(postMetersTotal / postPieceLen)
  const postPrice = applyDisc(postMat.price_per_unit)
  lineItems.push({
    name: `עמודים ${postSize}`,
    quantity: postPieces, unit: "יח'",
    detail: `${postCount} עמודים x ${height} מ' = ${postMetersTotal} מ' ריצה → ${postPieces} יח' של ${postPieceLen} מ'`,
    runningMeters: postMetersTotal,
    cost: round(postMetersTotal * postPrice)
  })

  // === תומכי תשתית ===
  const supportMetersTotal = width * supportCount
  const supportMat = getBeamMat(materials, support.section)
  const supportPieceLen = supportMat.piece_length || 4
  const supportPieces = Math.ceil(supportMetersTotal / supportPieceLen)
  const supportPrice = applyDisc(supportMat.price_per_unit)
  lineItems.push({
    name: `תומכי תשתית (${support.section})`,
    quantity: supportPieces, unit: "יח'",
    detail: `${supportCount} x ${width} מ' = ${supportMetersTotal} מ' ריצה → ${supportPieces} יח' של ${supportPieceLen} מ'`,
    runningMeters: supportMetersTotal,
    cost: round(supportMetersTotal * supportPrice)
  })

  // === קורות תשתית ===
  const baseBeamMetersTotal = baseBeamCount * length
  const baseBeamMat = getBeamMat(materials, baseBeam.section)
  const baseBeamPieceLen = baseBeamMat.piece_length || 4
  const baseBeamPieces = Math.ceil(baseBeamMetersTotal / baseBeamPieceLen)
  const baseBeamPrice = applyDisc(baseBeamMat.price_per_unit)
  lineItems.push({
    name: `קורות תשתית (${baseBeam.section})`,
    quantity: baseBeamPieces, unit: "יח'",
    detail: `${baseBeamCount} x ${length} מ' = ${baseBeamMetersTotal} מ' ריצה → ${baseBeamPieces} יח' של ${baseBeamPieceLen} מ'`,
    runningMeters: baseBeamMetersTotal,
    cost: round(baseBeamMetersTotal * baseBeamPrice)
  })

  // === קורות גג ===
  const roofBeamMetersTotal = roofBeamCount * width
  const roofBeamMat = getBeamMat(materials, '5x10')
  const roofBeamPieceLen = roofBeamMat.piece_length || 4
  const roofBeamPieces = Math.ceil(roofBeamMetersTotal / roofBeamPieceLen)
  const roofBeamPrice = applyDisc(roofBeamMat.price_per_unit)
  lineItems.push({
    name: 'קורות גג (5x10)',
    quantity: roofBeamPieces, unit: "יח'",
    detail: `${roofBeamCount} x ${width} מ' = ${roofBeamMetersTotal} מ' ריצה → ${roofBeamPieces} יח' של ${roofBeamPieceLen} מ'`,
    runningMeters: roofBeamMetersTotal,
    cost: round(roofBeamMetersTotal * roofBeamPrice)
  })

  // === בטון ===
  const concreteBags = Math.ceil(postCount * 2.5)
  const concretePrice = getMat(materials, 50).price_per_unit
  lineItems.push({ name: 'בטון', quantity: concreteBags, unit: 'שקים',
    detail: `${postCount} בסיסים x 2.5 שקים`, cost: round(concreteBags * concretePrice) })

  // === ברגים + תושבות + זפת ===
  const bracketsBase = postCount
  const bracketsWall = attachType === 'wall' ? baseBeamCount : 0
  const screwSetPrice = getMat(materials, 30).price_per_unit
  const bracketPrice = getMat(materials, 34).price_per_unit
  const miscCost = screwSetPrice + (bracketsBase + bracketsWall) * bracketPrice + 90
  lineItems.push({ name: 'ברגים, תושבות, זפת', quantity: 1, unit: 'סט', detail: '', cost: round(miscCost) })

  // === שמן ===
  lineItems.push({ name: 'שמן/שימון', quantity: 1, unit: 'לפרויקט', detail: '', cost: getMat(materials, 40).price_per_unit })

  // === קירוי ===
  if (roofType !== 'none') {
    let roofCost = 0
    const roofNames = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
    if (roofType === 'santef') {
      roofCost = round(area * applyDisc(getMat(materials, 20).price_per_unit))
    } else if (roofType === 'bh') {
      const bhPrice = applyDisc(getMat(materials, 21).price_per_unit)
      const screwPacks = Math.ceil(area * 10 / (getMat(materials, 33).pack_size || 400))
      roofCost = round(area * bhPrice + screwPacks * getMat(materials, 33).price_per_unit)
    } else if (roofType === 'thermo') {
      roofCost = round(area * applyDisc(getMat(materials, 22).price_per_unit))
    }
    lineItems.push({ name: `קירוי — ${roofNames[roofType]}`, quantity: 1, unit: '', detail: `${area} מ"ר`, cost: roofCost })
  }

  const totalMaterials = lineItems.reduce((sum, item) => sum + item.cost, 0)

  // === עבודה ===
  const workDays = Math.max(2, Math.ceil(length * width / 8))
  const laborOwner = workDays * (profile.hourly_rate ?? 250) * 8
  let helperDaily = 0, helperDays = 0
  if (helperType === 'regular') { helperDaily = profile.helper_daily ?? 900; helperDays = workDays }
  else if (helperType === 'pro') { helperDaily = 1300; helperDays = workDays }
  const laborHelper = helperDays * helperDaily
  const totalLabor = round(laborOwner + laborHelper)

  const travelCost = dims.travelCost || 200
  const accessPct = access === 'medium' ? 7.5 : access === 'hard' ? 15 : 0
  const accessCost = round((totalMaterials + totalLabor) * accessPct / 100)

  const subtotal = totalMaterials + totalLabor + travelCost + accessCost
  const totalOverhead = round(subtotal * (overheadPct / 100))
  const afterOverhead = subtotal + totalOverhead
  const totalSafety = round(afterOverhead * (safetyPct / 100))
  const totalProfit = round((afterOverhead + totalSafety) * (profitPct / 100))
  const totalBeforeVat = round(afterOverhead + totalSafety + totalProfit)
  const vat = round(totalBeforeVat * (vatPct / 100))
  const totalPrice = round(totalBeforeVat + vat)
  const pricePerSqm = area > 0 ? round(totalBeforeVat / area) : 0

  return {
    type: 'pergola',
    dimensions: { width, length, height, postSize, attachType, roofType, access, helperType },
    area,
    engineering: { baseBeamSection: baseBeam.section, supportSection: support.section, roofBeamSection: '5x10', postCount },
    lineItems, travel: travelCost, accessCost,
    labor: { days: workDays, owner: round(laborOwner), helper: round(laborHelper), total: totalLabor },
    totals: { materials: totalMaterials, labor: totalLabor, overhead: totalOverhead, safety: totalSafety,
      profit: totalProfit, beforeVat: totalBeforeVat, vat, total: totalPrice, pricePerSqm }
  }
}

// שליפת חומר מהמחירון לפי ID
function getMat(materials, id) {
  return materials.find(m => m.id === id && m.is_active) || { price_per_unit: 0, piece_length: 0 }
}

// שליפת קורה לפי חתך הנדסי (5x10, 5x15 וכו')
function getBeamMat(materials, section) {
  const beamIds = { '5x10': 3, '5x15': 4, '5x20': 5, '7x20': 6, '7x25': 6, '10x25': 7, '10x30': 7, '15x30': 7, '20x30': 7 }
  const id = beamIds[section] || 4
  return getMat(materials, id)
}

function round(n) { return Math.round(n) }
