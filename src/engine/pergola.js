/**
 * מנוע חישוב פרגולה — תרגום 1:1 מאקסל אורי גזית v7
 * כל נוסחה מתורגמת ישירות, בלי שינויים ובלי "שיפורים"
 */
import { getMaterials } from '../utils/storage'

// מחירי בסיס (מחירון נוימן — ברירת מחדל)
const BASE_PRICES = {
  beam_52x160: 22.09,   // תומך תשתית
  joist_52x105: 14.50,  // קורות תשתית + קורות גג
  post_15: 78,
  post_20: 138,
  bracket: 28.32,       // תושבת
  concrete: 30,         // שק בטון
  screws_set: 500,      // ברגים שלד
  tar: 90,              // זפת
  oil: 400,             // שמן
  santef: 46.61,
  santef_bh: 103.84,
  thermo: 28.32,
  screws_bh: 400,       // ברגי BH — חבילה
  hourly: 250,
  helper: 900,
  pro_worker: 1300,
}

const MAX_SPAN = 3.0  // ספן מקסימלי בין עמודים — מגיליון הנדסה

export function calculatePergola(dims, rules, materialsList, profile) {
  const { width: W, length: L, height = 3, postSize = '15x15', attachType = 'wall',
    roofType = 'none', access = 'easy', helperType = 'regular',
    supplierDiscount = 0 } = dims

  // פרמטרים — בדיוק כמו באקסל
  const safetyPct = profile.safety_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const MARGIN = (1 + safetyPct / 100) * (1 + profitPct / 100)
  const discount = supplierDiscount || profile.supplier_discount || 0
  const hourlyRate = profile.hourly_rate ?? BASE_PRICES.hourly
  const helperDaily = profile.helper_daily ?? BASE_PRICES.helper

  // מחירים עם הנחת ספק
  const disc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100
  const ep_beam = disc(BASE_PRICES.beam_52x160)    // תומך תשתית — תמיד 52x160
  const ep_joist = disc(BASE_PRICES.joist_52x105)  // קורות — תמיד 52x105
  const postPrice = postSize === '20x20' ? BASE_PRICES.post_20 : BASE_PRICES.post_15
  const bracketPrice = disc(BASE_PRICES.bracket)

  // === כתב כמויות — בדיוק כמו באקסל ===

  // כמות עמודים
  let postCount
  if (attachType === 'wall') {
    postCount = Math.ceil(L / MAX_SPAN) + 1
  } else {
    postCount = (Math.ceil(W / MAX_SPAN) + 1) * (Math.ceil(L / MAX_SPAN) + 1)
  }

  // אורך עמודים כולל
  const postMeters = postCount * height

  // תומך תשתית — מ' עץ: W × (CEILING(L/MAX_SPAN)+1)
  const supportMeters = W * (Math.ceil(L / MAX_SPAN) + 1)

  // קורות תשתית — כמות: CEILING(W/ריווח)+1, ריווח=0.75
  const baseBeamSpacing = 0.75
  const baseBeamCount = Math.ceil(W / baseBeamSpacing) + 1
  const baseBeamMeters = baseBeamCount * L

  // קורות גג — (CEILING(L/0.6)+1) × W
  const roofBeamMeters = (Math.ceil(L / 0.6) + 1) * W

  // בטון — עמודים × 2.5
  const concreteBags = Math.ceil(postCount * 2.5)

  // תושבות עמוד
  const bracketsBase = postCount
  // תושבות קיר — אחת לכל קורת תשתית (רק בצמודת קיר)
  const bracketsWall = attachType === 'wall' ? baseBeamCount : 0

  // שטח קירוי
  const area = L * W

  // === חישוב עלויות — בדיוק כמו באקסל ===
  const lineItems = []

  // עמודים
  const costPosts = Math.round(postMeters * postPrice)
  lineItems.push({ name: `עמודים ${postSize}`, quantity: postCount, unit: "יח'",
    detail: `${postCount} × ${height} מ' = ${postMeters} מ' ריצה`, cost: costPosts })

  // תומך תשתית — תמיד במחיר beam 52×160!
  const costSupport = Math.round(supportMeters * ep_beam)
  lineItems.push({ name: 'תומך תשתית (52×160)', quantity: Math.ceil(L / MAX_SPAN) + 1, unit: "יח'",
    detail: `${supportMeters} מ' ריצה × ${ep_beam} ₪/מ'`, cost: costSupport })

  // קורות תשתית — תמיד במחיר joist 52×105!
  const costBaseBeams = Math.round(baseBeamMeters * ep_joist)
  lineItems.push({ name: 'קורות תשתית (52×105)', quantity: baseBeamCount, unit: "יח'",
    detail: `${baseBeamMeters} מ' ריצה × ${ep_joist} ₪/מ'`, cost: costBaseBeams })

  // קורות גג — תמיד במחיר joist 52×105!
  const costRoofBeams = Math.round(roofBeamMeters * ep_joist)
  lineItems.push({ name: 'קורות גג (52×105)', quantity: Math.ceil(L / 0.6) + 1, unit: "יח'",
    detail: `${roofBeamMeters} מ' ריצה × ${ep_joist} ₪/מ'`, cost: costRoofBeams })

  // בטון
  const costConcrete = Math.ceil(concreteBags) * BASE_PRICES.concrete
  lineItems.push({ name: 'בטון', quantity: Math.ceil(concreteBags), unit: 'שקים',
    detail: `${postCount} × 2.5 שקים`, cost: costConcrete })

  // ברגים + תושבות + זפת: 500 + תושבות×מחיר + 90
  const costMisc = Math.round(BASE_PRICES.screws_set + (bracketsBase + bracketsWall) * bracketPrice + BASE_PRICES.tar)
  lineItems.push({ name: 'ברגים, תושבות, זפת', quantity: 1, unit: 'סט',
    detail: `500 + ${bracketsBase + bracketsWall} תושבות + 90 זפת`, cost: costMisc })

  // שמן
  lineItems.push({ name: 'שמן/שימון', quantity: 1, unit: 'לפרויקט', detail: '', cost: BASE_PRICES.oil })

  // קירוי
  let costCover = 0
  if (roofType === 'santef') {
    costCover = Math.round(area * disc(BASE_PRICES.santef))
  } else if (roofType === 'bh') {
    costCover = Math.round(area * disc(BASE_PRICES.santef_bh) + Math.ceil(area * 10 / 400) * BASE_PRICES.screws_bh)
  } else if (roofType === 'thermo') {
    costCover = Math.round(area * disc(BASE_PRICES.thermo))
  }
  if (costCover > 0) {
    const roofNames = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
    lineItems.push({ name: `קירוי — ${roofNames[roofType]}`, quantity: 1, unit: '', detail: `${area} מ"ר`, cost: costCover })
  }

  // עבודה — ימים: MAX(2, CEILING(L×W/8))
  const workDays = Math.max(2, Math.ceil(L * W / 8))
  const costLaborOwner = workDays * 8 * hourlyRate
  let costLaborHelper = 0
  if (helperType === 'regular') costLaborHelper = workDays * helperDaily
  else if (helperType === 'pro') costLaborHelper = workDays * BASE_PRICES.pro_worker

  // נסיעות
  const travelCost = dims.travelCost || 200

  // תוספת גישה — על (עמודים+תומך+קורות+גג+בטון+ברגים+קירוי+עבודה)
  const accessBase = costPosts + costSupport + costBaseBeams + costRoofBeams + costConcrete + costMisc + costCover + costLaborOwner + costLaborHelper
  let costAccess = 0
  if (access === 'medium') costAccess = Math.round(accessBase * 0.075)
  else if (access === 'hard') costAccess = Math.round(accessBase * 0.15)

  // תקורה 5% — על (עמודים+תומך+קורות+גג+בטון+ברגים+קירוי+עבודה) — בלי נסיעות!
  const overheadBase = costPosts + costSupport + costBaseBeams + costRoofBeams + costConcrete + costMisc + costCover + costLaborOwner + costLaborHelper
  const costOverhead = Math.round(overheadBase * (profile.overhead_pct ?? 5) / 100)

  // סה"כ עלויות = כל הפריטים + שמן + עבודה + נסיעות + גישה + תקורה
  const totalCosts = lineItems.reduce((s, i) => s + i.cost, 0) + costLaborOwner + costLaborHelper + travelCost + costAccess + costOverhead

  // מחיר ללקוח = סה"כ עלויות × (1+ביטחון%) × (1+רווח%)
  const priceBeforeVat = Math.round(totalCosts * MARGIN)
  const vat = Math.round(priceBeforeVat * 0.18)
  const totalPrice = priceBeforeVat + vat
  const pricePerSqm = area > 0 ? Math.round(priceBeforeVat / area) : 0

  return {
    type: 'pergola',
    dimensions: { width: W, length: L, height, postSize, attachType, roofType, access, helperType },
    area,
    engineering: {
      postCount,
      supportMeters, baseBeamMeters, roofBeamMeters,
      baseBeamSection: '52×105', supportSection: '52×160',
    },
    lineItems,
    labor: { days: workDays, owner: costLaborOwner, helper: costLaborHelper, total: costLaborOwner + costLaborHelper },
    travel: travelCost, accessCost: costAccess,
    totals: {
      materials: lineItems.reduce((s, i) => s + i.cost, 0),
      labor: costLaborOwner + costLaborHelper,
      overhead: costOverhead,
      safety: 0, // כלול ב-MARGIN
      profit: 0, // כלול ב-MARGIN
      totalCosts,
      beforeVat: priceBeforeVat,
      vat,
      total: totalPrice,
      pricePerSqm,
      margin: MARGIN,
    }
  }
}
