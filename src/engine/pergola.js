/**
 * מנוע חישוב פרגולה — נוסחאות 1:1 מאקסל + מחירים מהמחירון של הקבלן
 */
import { getMaterials } from '../utils/storage'

// ברירות מחדל — משמשות רק אם הקבלן לא שינה במחירון
const DEFAULTS = {
  beam_52x160: { id: 4, price: 22.09 },   // תומך תשתית — תמיד 52x160
  joist_52x105: { id: 3, price: 14.50 },   // קורות — תמיד 52x105
  post_15: { id: 1, price: 78 },
  post_20: { id: 2, price: 138 },
  bracket: { id: 34, price: 28.32 },
  concrete: { id: 50, price: 30 },
  screws_set: { id: 30, price: 500 },
  oil: { id: 40, price: 400 },
  santef: { id: 20, price: 46.61 },
  santef_bh: { id: 21, price: 103.84 },
  thermo: { id: 22, price: 28.32 },
  screws_bh: { id: 33, price: 400 },
}

const MAX_SPAN = 3.0
const TAR_COST = 90

// שולף מחיר מהמחירון — אם הקבלן שינה, לוקח את שלו. אם לא — ברירת מחדל.
function getPrice(materials, key) {
  const def = DEFAULTS[key]
  if (!def) return 0
  const mat = materials.find(m => m.id === def.id && m.is_active)
  return mat ? Number(mat.price_per_unit) : def.price
}

// שולף מידה (piece_length) מהמחירון
function getPieceLength(materials, key) {
  const def = DEFAULTS[key]
  if (!def) return 0
  const mat = materials.find(m => m.id === def.id && m.is_active)
  return mat?.piece_length || 0
}

export function calculatePergola(dims, rules, materialsList, profile) {
  const { width: W, length: L, height = 3, postSize = '15x15', attachType = 'wall',
    roofType = 'none', access = 'easy', helperType = 'regular',
    supplierDiscount = 0 } = dims

  const materials = getMaterials()

  const safetyPct = profile.safety_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const MARGIN = (1 + safetyPct / 100) * (1 + profitPct / 100)
  const discount = supplierDiscount || profile.supplier_discount || 0
  const hourlyRate = profile.hourly_rate ?? 250
  const helperDaily = profile.helper_daily ?? 900

  // מחירים — מהמחירון של הקבלן (עם הנחת ספק)
  const disc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100
  const ep_beam = disc(getPrice(materials, 'beam_52x160'))
  const ep_joist = disc(getPrice(materials, 'joist_52x105'))
  const postPrice = getPrice(materials, postSize === '20x20' ? 'post_20' : 'post_15')
  const bracketPrice = disc(getPrice(materials, 'bracket'))

  // === כתב כמויות — נוסחאות מהאקסל ===
  let postCount
  if (attachType === 'wall') {
    postCount = Math.ceil(L / MAX_SPAN) + 1
  } else {
    postCount = (Math.ceil(W / MAX_SPAN) + 1) * (Math.ceil(L / MAX_SPAN) + 1)
  }

  const postMeters = postCount * height
  const supportMeters = W * (Math.ceil(L / MAX_SPAN) + 1)
  const baseBeamSpacing = 0.75
  const baseBeamCount = Math.ceil(W / baseBeamSpacing) + 1
  const baseBeamMeters = baseBeamCount * L
  const roofBeamMeters = (Math.ceil(L / 0.6) + 1) * W
  const concreteBags = Math.ceil(postCount * 2.5)
  const bracketsBase = postCount
  const bracketsWall = attachType === 'wall' ? baseBeamCount : 0
  const area = L * W

  // === עלויות ===
  const lineItems = []

  const costPosts = Math.round(postMeters * postPrice)
  lineItems.push({ name: `עמודים ${postSize}`, quantity: postCount, unit: "יח'",
    detail: `${postMeters} מ' ריצה`, cost: costPosts })

  const costSupport = Math.round(supportMeters * ep_beam)
  lineItems.push({ name: 'תומך תשתית', quantity: Math.ceil(L / MAX_SPAN) + 1, unit: "יח'",
    detail: `${supportMeters} מ' × ${ep_beam} ₪/מ'`, cost: costSupport })

  const costBaseBeams = Math.round(baseBeamMeters * ep_joist)
  lineItems.push({ name: 'קורות תשתית', quantity: baseBeamCount, unit: "יח'",
    detail: `${baseBeamMeters} מ' × ${ep_joist} ₪/מ'`, cost: costBaseBeams })

  const costRoofBeams = Math.round(roofBeamMeters * ep_joist)
  lineItems.push({ name: 'קורות גג', quantity: Math.ceil(L / 0.6) + 1, unit: "יח'",
    detail: `${roofBeamMeters} מ' × ${ep_joist} ₪/מ'`, cost: costRoofBeams })

  const costConcrete = Math.ceil(concreteBags) * getPrice(materials, 'concrete')
  lineItems.push({ name: 'בטון', quantity: Math.ceil(concreteBags), unit: 'שקים', detail: '', cost: costConcrete })

  const screwSetPrice = getPrice(materials, 'screws_set')
  const costMisc = Math.round(screwSetPrice + (bracketsBase + bracketsWall) * bracketPrice + TAR_COST)
  lineItems.push({ name: 'ברגים, תושבות, זפת', quantity: 1, unit: 'סט', detail: '', cost: costMisc })

  const oilPrice = getPrice(materials, 'oil')
  lineItems.push({ name: 'שמן/שימון', quantity: 1, unit: 'לפרויקט', detail: '', cost: oilPrice })

  // קירוי
  let costCover = 0
  if (roofType === 'santef') {
    costCover = Math.round(area * disc(getPrice(materials, 'santef')))
  } else if (roofType === 'bh') {
    const bhPrice = disc(getPrice(materials, 'santef_bh'))
    const bhScrewPrice = getPrice(materials, 'screws_bh')
    costCover = Math.round(area * bhPrice + Math.ceil(area * 10 / 400) * bhScrewPrice)
  } else if (roofType === 'thermo') {
    costCover = Math.round(area * disc(getPrice(materials, 'thermo')))
  }
  if (costCover > 0) {
    const rn = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
    lineItems.push({ name: `קירוי — ${rn[roofType]}`, quantity: 1, unit: '', detail: `${area} מ"ר`, cost: costCover })
  }

  // עבודה — קצב לפי פרופיל הקבלן
  const REF_AREA = 12 // פרגולה ממוצעת 3×4 = 12 מ"ר
  const hasHelper = helperType === 'regular' || helperType === 'pro'
  const refDays = hasHelper
    ? (profile.pergola_days_with_helper ?? 3)
    : (profile.pergola_days_alone ?? 5)
  const sqmPerDay = REF_AREA / refDays
  const workDays = Math.max(2, Math.ceil(area / sqmPerDay))
  const costLaborOwner = workDays * 8 * hourlyRate
  let costLaborHelper = 0
  if (helperType === 'regular') costLaborHelper = workDays * helperDaily
  else if (helperType === 'pro') costLaborHelper = workDays * 1300

  const travelCost = dims.travelCost || 200

  // גישה — על חומרים+עבודה (בלי נסיעות, שמן, קירוי כן)
  const accessBase = costPosts + costSupport + costBaseBeams + costRoofBeams + costConcrete + costMisc + costCover + costLaborOwner + costLaborHelper
  let costAccess = 0
  if (access === 'medium') costAccess = Math.round(accessBase * 0.075)
  else if (access === 'hard') costAccess = Math.round(accessBase * 0.15)

  // תקורה — על חומרים+עבודה (בלי נסיעות)
  const overheadBase = costPosts + costSupport + costBaseBeams + costRoofBeams + costConcrete + costMisc + costCover + costLaborOwner + costLaborHelper
  const costOverhead = Math.round(overheadBase * (profile.overhead_pct ?? 5) / 100)

  const totalCosts = lineItems.reduce((s, i) => s + i.cost, 0) + costLaborOwner + costLaborHelper + travelCost + costAccess + costOverhead
  const priceBeforeVat = Math.round(totalCosts * MARGIN)
  const vat = Math.round(priceBeforeVat * 0.18)
  const totalPrice = priceBeforeVat + vat
  const pricePerSqm = area > 0 ? Math.round(priceBeforeVat / area) : 0

  return {
    type: 'pergola',
    dimensions: { width: W, length: L, height, postSize, attachType, roofType, access, helperType },
    area,
    engineering: { postCount, supportMeters, baseBeamMeters, roofBeamMeters },
    lineItems,
    labor: { days: workDays, owner: costLaborOwner, helper: costLaborHelper, total: costLaborOwner + costLaborHelper },
    travel: travelCost, accessCost: costAccess,
    totals: {
      materials: lineItems.reduce((s, i) => s + i.cost, 0),
      labor: costLaborOwner + costLaborHelper,
      overhead: costOverhead,
      totalCosts, beforeVat: priceBeforeVat, vat, total: totalPrice, pricePerSqm, margin: MARGIN,
    }
  }
}
