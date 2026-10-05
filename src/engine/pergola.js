/**
 * מנוע חישוב פרגולה — לפי האקסל של הקבלן (uri_gazit_v7) + מחירון ואורכי מלאי של הקבלן
 *
 * צירים כמו באקסל: L = הבולט מהקיר (עומק), W = לאורך הקיר.
 * תומכים רצים לאורך W, קורות תשתית לאורך L (מעל התומכים), קורות גג לאורך W (מעל קורות התשתית).
 */
import { getMaterials } from '../utils/storage'
import { buildBreakdown } from './breakdown'
import { cutPlan, describeCutPlan, getStockLengths, fmtM, round2 } from './stock'
import { getBaseBeamSection, getSupportSection } from './engineering'

// ברירות מחדל — משמשות רק אם הקבלן לא שינה במחירון
const DEFAULTS = {
  post_15: { id: 1, price: 78 },
  post_20: { id: 2, price: 138 },
  bracket: { id: 34, price: 28.32 },
  steel_splice: { id: 35, price: 28.32 }, // תושבת ברזל לחיבור קורות (2 לכל חיבור)
  concrete: { id: 50, price: 30 },
  screws_set: { id: 30, price: 500 },
  oil: { id: 40, price: 400 },
  santef: { id: 20, price: 46.61 },
  santef_bh: { id: 21, price: 103.84 },
  thermo: { id: 22, price: 28.32 },
  screws_bh: { id: 33, price: 400 },
}

export const MAX_POST_SPAN = 7       // מפתח מקסימלי בין עמודים (אקסל: הנדסה!B5)
export const BASE_BEAM_SPACING = 0.75 // ריווח קורות תשתית (אקסל: B10)
export const ROOF_BEAM_SPACING = 0.75 // ריווח קורות גג (אקסל: הנדסה!B9)
export const DEFAULT_BEAM_ID = 3      // 5x10 — ברירת מחדל לכל הקורות (לבקשת הקבלן, לא לפי תקן)
const TAR_COST = 90
const SPLICE_BRACKETS_PER_JOINT = 2

export const OVER_LENGTH_OPTIONS = {
  special: { label: 'הזמנה מיוחדת', desc: 'מזמינים מהספק קורה באורך הנדרש' },
  steel: { label: 'חיבור בתושבות ברזל', desc: 'מחברים שתי קורות בתושבות ברזל, גם בלי תמיכה מתחת' },
  post: { label: 'עמוד נוסף', desc: 'מוסיפים עמודים ותומך כדי שהחיבור ייפול על תמיכה' },
}

function getPrice(materials, key) {
  const def = DEFAULTS[key]
  if (!def) return 0
  const mat = materials.find(m => m.id === def.id && m.is_active)
  return mat ? Number(mat.price_per_unit) : def.price
}

// חתכי הקורות שבמחירון (קטגוריית "קורות"), לבחירה בהצעה
export function beamOptions(materials = getMaterials()) {
  return materials.filter(m => m.category === 'קורות' && m.is_active && m.width > 0 && m.height > 0)
    .map(m => ({ id: m.id, section: `${fmtM(m.width)}x${fmtM(m.height)}`, name: m.name }))
}

// פירוק "5+2" לרשימת מפתחים. מחזיר null אם לא תקין
export function parseSpans(text, total) {
  if (!text || !String(text).trim()) return null
  const parts = String(text).split(/[+,]/).map(s => Number(s.trim())).filter(x => x > 0)
  if (!parts.length) return { error: 'לא הבנתי את החלוקה. כתבו למשל 5+2' }
  const sum = round2(parts.reduce((s, x) => s + x, 0))
  if (Math.abs(sum - total) > 0.05) return { error: `סכום המפתחים (${fmtM(sum)} מ') לא שווה לרוחב (${fmtM(total)} מ')` }
  if (parts.some(p => p > MAX_POST_SPAN)) return { error: `מפתח מעל ${MAX_POST_SPAN} מ' — צריך לחלק לעוד מפתחים` }
  return { spans: parts }
}

// השוואת חתכים: "7x20" גדול או שווה ל-"5x15"?
function sectionAtLeast(have, need) {
  const [a, b] = String(have).split('x').map(Number)
  const [c, d] = String(need).split('x').map(Number)
  return a >= c && b >= d
}

/** גאומטריה — מיקומי עמודים, תומכים וקורות (מ'). מקור אחד לשרטוט ולכמויות */
function buildLayout({ L, W, attachType, wSpans, maxSpanL, maxSpanW }) {
  const equal = (total) => { const k = Math.max(1, Math.ceil(total / MAX_POST_SPAN - 1e-9)); return Array(k).fill(total / k) }
  // מפתח ארוך ממגבלת האורך ("עמוד נוסף") — מחלקים כך שכל קטע הוא קורה שלמה מהמלאי, והשארית בסוף (למשל 4+1)
  const splitLong = (spans, limit) => spans.flatMap(s => {
    if (!(s > limit + 1e-9)) return [s]
    const parts = []
    let rest = s
    while (rest > limit + 1e-9) { parts.push(limit); rest = round2(rest - limit) }
    if (rest > 0) parts.push(rest)
    return parts
  })
  const cumulative = (spans) => spans.reduce((acc, s) => [...acc, round2(acc[acc.length - 1] + s)], [0])

  // מפתחים לאורך הקיר (בין עמודים): חלוקה ידנית או אוטומטית
  const spansW = splitLong(wSpans?.length ? wSpans : equal(W), maxSpanW)
  const postX = cumulative(spansW)

  // שורות תומכים לאורך הבליטה: בצמוד קיר — הקיר מחזיק את הצד האחד
  const spansL = splitLong(equal(L), maxSpanL)
  const nL = spansL.length
  const supportY = cumulative(spansL).filter(y => attachType !== 'wall' || y > 0)

  const spread = (n, total) => Array.from({ length: n }, (_, i) => (n > 1 ? round2(i * total / (n - 1)) : 0))
  const baseBeamCount = Math.ceil(W / BASE_BEAM_SPACING - 1e-9) + 1
  const roofBeamCount = Math.ceil(L / ROOF_BEAM_SPACING - 1e-9) + 1
  return {
    L, W, attachType, spansW: spansW.map(round2), spansL: spansL.map(round2), nL,
    postX,
    supports: supportY,                                 // קווי תומך לאורך W, בעומק y
    posts: supportY.flatMap(y => postX.map(x => [x, y])),
    baseBeams: spread(baseBeamCount, W),                // קורות תשתית לאורך L, במיקום x
    roofBeams: spread(roofBeamCount, L),                // קורות גג לאורך W, בעומק y
  }
}

export function calculatePergola(dims, rules, materialsList, profile) {
  const { overLength = 'special' } = dims
  // מחשבים את האפשרות שנבחרה. אם יש קורה ארוכה מהמלאי — מחשבים גם את שתי האחרות להשוואת מחיר
  const chosen = computeVariant(dims, profile, overLength === 'post' ? 'special' : overLength, overLength === 'post')
  const probe = overLength === 'special' ? chosen : computeVariant(dims, profile, 'special', false)
  if (!probe.engineering.overLength) return chosen

  const variants = {
    special: probe,
    steel: overLength === 'steel' ? chosen : computeVariant(dims, profile, 'steel', false),
    post: overLength === 'post' ? chosen : computeVariant(dims, profile, 'special', true),
  }
  chosen.overLengthOptions = Object.entries(OVER_LENGTH_OPTIONS).map(([key, o]) => ({
    key, ...o, total: variants[key].totals.total, delta: variants[key].totals.total - variants.special.totals.total,
    posts: variants[key].engineering.postCount,
  }))
  chosen.overLengthChoice = overLength
  chosen.engineering.overLength = probe.engineering.overLength
  return chosen
}

function computeVariant(dims, profile, overLengthMode, addPosts) {
  const { width: W, length: L, height = 3, postSize = '15x15', attachType = 'wall',
    roofType = 'none', access = 'easy', helperType = 'regular', supplierDiscount = 0, spansText = '',
    supportMatId = DEFAULT_BEAM_ID, baseMatId = DEFAULT_BEAM_ID, roofMatId = DEFAULT_BEAM_ID } = dims

  const materials = getMaterials()
  const matById = (id) => materials.find(m => m.id === Number(id) && m.is_active) || materials.find(m => m.id === DEFAULT_BEAM_ID)

  const safetyPct = profile.safety_pct ?? 5
  const profitPct = profile.profit_pct ?? 20
  const MARGIN = (1 + safetyPct / 100) * (1 + profitPct / 100)
  const discount = supplierDiscount || profile.supplier_discount || 0
  const hourlyRate = profile.hourly_rate ?? 250
  const helperDaily = profile.helper_daily ?? 900
  const disc = (price) => Math.round(price * (1 - discount / 100) * 100) / 100

  const supportMat = matById(supportMatId), baseMat = matById(baseMatId), roofMat = matById(roofMatId)
  const priceOf = (mat, fallback) => disc(Number(mat?.price_per_unit) || fallback)
  const sectionOf = (mat) => (mat ? `${fmtM(mat.width)}x${fmtM(mat.height)}` : '5x10')
  const postMat = materials.find(m => m.id === (postSize === '20x20' ? 2 : 1))
  const postPrice = getPrice(materials, postSize === '20x20' ? 'post_20' : 'post_15')
  const bracketPrice = disc(getPrice(materials, 'bracket'))

  // "עמוד נוסף": מגבילים את המפתח לאורך הקורה הארוכה שיש במלאי, כדי שכל חיבור ייפול על תמיכה
  const longest = (mat) => Math.max(0, ...getStockLengths(mat))
  const parsed = parseSpans(spansText, W)
  const layout = buildLayout({ L, W, attachType, wSpans: parsed?.spans,
    maxSpanW: addPosts && longest(supportMat) ? longest(supportMat) : Infinity,
    maxSpanL: addPosts && longest(baseMat) ? longest(baseMat) : Infinity })

  const postCount = layout.posts.length
  const supportCount = layout.supports.length
  const baseBeamCount = layout.baseBeams.length
  const roofBeamCount = layout.roofBeams.length
  const area = round2(L * W)

  // === תוכניות חיתוך — חיבור רק מעל תמיכה (או לפי האפשרות שנבחרה לקורה ארוכה מהמלאי) ===
  const postPlan = cutPlan({ runLength: height, count: postCount, stockLengths: getStockLengths(postMat) })
  const supportPlan = cutPlan({ runLength: W, count: supportCount, stockLengths: getStockLengths(supportMat),
    supports: layout.postX, overLength: overLengthMode })
  const basePlan = cutPlan({ runLength: L, count: baseBeamCount, stockLengths: getStockLengths(baseMat),
    supports: attachType === 'wall' ? [0, ...layout.supports] : layout.supports, overLength: overLengthMode })
  const roofPlan = cutPlan({ runLength: W, count: roofBeamCount, stockLengths: getStockLengths(roofMat),
    supports: layout.baseBeams, overLength: overLengthMode })

  // === חתכים: מה שנבחר מול מה שמומלץ בטבלת המפתחות (ת"י 1556, גג קל, ריווח 0.75) ===
  const maxSpanW = Math.max(...layout.spansW)
  const spanL = Math.max(...layout.spansL)
  const recommended = {
    support: getSupportSection(maxSpanW, spanL).section,
    base: getBaseBeamSection(spanL, BASE_BEAM_SPACING).section,
  }
  const supportSection = sectionOf(supportMat), baseBeamSection = sectionOf(baseMat), roofBeamSection = sectionOf(roofMat)
  const standardIssues = []
  if (!sectionAtLeast(supportSection, recommended.support)) standardIssues.push(`תומך ${supportSection} (מומלץ ${recommended.support})`)
  if (!sectionAtLeast(baseBeamSection, recommended.base)) standardIssues.push(`קורת תשתית ${baseBeamSection} (מומלץ ${recommended.base})`)
  const standardNote = standardIssues.length
    ? `החתכים לא לפי ת"י 1556: ${standardIssues.join(', ')}. לחיזוק — חתך גדול יותר או מפתח קטן יותר (עוד עמודים).`
    : ''

  // === עלויות ===
  const lineItems = []
  const stockLine = (name, plan, price, runName, extra) => {
    const cost = Math.round(plan.purchasedM * price)
    const allSpecial = plan.patterns.length > 0 && plan.patterns.every(p => p.special)
    lineItems.push({ name, quantity: plan.bars,
      unit: allSpecial ? `יח' באורך ${fmtM(plan.specialLength)} מ'` : plan.mixedLengths ? `יח' (אורכים שונים)` : `יח' של ${fmtM(plan.stockLength)} מ'`,
      detail: `${extra} | פחת ${fmtM(plan.wasteM)} מ' (${plan.wastePct}%)`,
      cost, wasteCost: Math.round(plan.wasteM * price), cutPlan: describeCutPlan(plan, runName) })
    return cost
  }
  const costPosts = stockLine(`עמודים ${postSize}`, postPlan, postPrice, 'עמוד', `${postCount} עמודים בגובה ${fmtM(height)} מ'`)
  const costSupport = stockLine(`תומך תשתית ${supportSection}`, supportPlan, priceOf(supportMat, 14.5), 'תומך', `${supportCount} תומכים באורך ${fmtM(W)} מ'`)
  const costBaseBeams = stockLine(`קורות תשתית ${baseBeamSection}`, basePlan, priceOf(baseMat, 14.5), 'קורת תשתית', `${baseBeamCount} קורות באורך ${fmtM(L)} מ'`)
  const costRoofBeams = stockLine(`קורות גג ${roofBeamSection}`, roofPlan, priceOf(roofMat, 14.5), 'קורת גג', `${roofBeamCount} קורות באורך ${fmtM(W)} מ'`)

  // תושבות ברזל לחיבור — רק אם נבחר חיבור בברזל
  const steelJoints = supportPlan.steelJoints + basePlan.steelJoints + roofPlan.steelJoints
  let costSteel = 0
  if (steelJoints > 0) {
    const n = steelJoints * SPLICE_BRACKETS_PER_JOINT
    costSteel = Math.round(n * disc(getPrice(materials, 'steel_splice')))
    lineItems.push({ name: 'תושבות ברזל לחיבור קורות', quantity: n, unit: "יח'", detail: `${steelJoints} חיבורים × ${SPLICE_BRACKETS_PER_JOINT}`, cost: costSteel })
  }

  const concreteBags = Math.ceil(postCount * 2.5)
  const costConcrete = concreteBags * getPrice(materials, 'concrete')
  lineItems.push({ name: 'בטון', quantity: concreteBags, unit: 'שקים', detail: `${postCount} בסיסים × 2.5`, cost: costConcrete })

  const bracketsBase = postCount
  const bracketsWall = attachType === 'wall' ? baseBeamCount : 0
  const costMisc = Math.round(getPrice(materials, 'screws_set') + (bracketsBase + bracketsWall) * bracketPrice + TAR_COST)
  lineItems.push({ name: 'ברגים, תושבות, זפת', quantity: 1, unit: 'סט', detail: `${bracketsBase + bracketsWall} תושבות`, cost: costMisc })

  const oilPrice = getPrice(materials, 'oil')
  lineItems.push({ name: 'שמן/שימון', quantity: 1, unit: 'לפרויקט', detail: '', cost: oilPrice })

  let costCover = 0
  if (roofType === 'santef') costCover = Math.round(area * disc(getPrice(materials, 'santef')))
  else if (roofType === 'bh') costCover = Math.round(area * disc(getPrice(materials, 'santef_bh')) + Math.ceil(area * 10 / 400) * getPrice(materials, 'screws_bh'))
  else if (roofType === 'thermo') costCover = Math.round(area * disc(getPrice(materials, 'thermo')))
  if (costCover > 0) {
    const rn = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
    lineItems.push({ name: `קירוי — ${rn[roofType]}`, quantity: 1, unit: '', detail: `${fmtM(area)} מ"ר`, cost: costCover })
  }

  // עבודה — קצב לפי פרופיל הקבלן
  const REF_AREA = 12
  const hasHelper = helperType === 'regular' || helperType === 'pro'
  const refDays = hasHelper ? (profile.pergola_days_with_helper ?? 3) : (profile.pergola_days_alone ?? 5)
  const workDays = Math.max(2, Math.ceil(area / (REF_AREA / refDays) - 1e-9))
  const costLaborOwner = workDays * 8 * hourlyRate
  let costLaborHelper = 0
  if (helperType === 'regular') costLaborHelper = workDays * helperDaily
  else if (helperType === 'pro') costLaborHelper = workDays * 1300

  const travelCost = dims.travelCost || 200
  const accessBase = costPosts + costSupport + costBaseBeams + costRoofBeams + costSteel + costConcrete + costMisc + costCover + costLaborOwner + costLaborHelper
  let costAccess = 0
  if (access === 'medium') costAccess = Math.round(accessBase * 0.075)
  else if (access === 'hard') costAccess = Math.round(accessBase * 0.15)
  const costOverhead = Math.round(accessBase * (profile.overhead_pct ?? 5) / 100)

  const totalCosts = lineItems.reduce((s, i) => s + i.cost, 0) + costLaborOwner + costLaborHelper + travelCost + costAccess + costOverhead
  const priceBeforeVat = Math.round(totalCosts * MARGIN)
  const vat = Math.round(priceBeforeVat * 0.18)
  const totals = {
    materials: lineItems.reduce((s, i) => s + i.cost, 0),
    labor: costLaborOwner + costLaborHelper,
    overhead: costOverhead,
    totalCosts, beforeVat: priceBeforeVat, vat, total: priceBeforeVat + vat,
    pricePerSqm: area > 0 ? Math.round(priceBeforeVat / area) : 0, margin: MARGIN,
  }

  const overLengthGap = Math.max(supportPlan.overLengthGap, basePlan.overLengthGap, roofPlan.overLengthGap)
  return {
    type: 'pergola',
    dimensions: { width: W, length: L, height, postSize, attachType, roofType, access, helperType },
    area,
    // מקור אחד לשרטוט ולכתב הכמויות
    engineering: { postCount, supportCount, baseBeamCount, roofBeamCount, spansW: layout.spansW, nL: layout.nL,
      supportSection, baseBeamSection, roofBeamSection, recommended, standardNote, layout,
      spansError: parsed?.error || '',
      overLength: overLengthGap > 0 ? { gap: overLengthGap,
        longest: Math.max(longest(supportMat), longest(baseMat), longest(roofMat)) } : null },
    lineItems,
    labor: { days: workDays, owner: costLaborOwner, helper: costLaborHelper, total: costLaborOwner + costLaborHelper },
    travel: travelCost, accessCost: costAccess,
    includes: { concrete: concreteBags > 0 },
    totals,
    breakdown: buildBreakdown({ lineItems, totals, travel: travelCost, accessCost: costAccess,
      safetyPct, profitPct, overheadPct: profile.overhead_pct ?? 5 }),
  }
}
