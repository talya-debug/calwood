/**
 * טבלאות הנדסיות — לפי ת"י 1556
 *
 * העיקרון: המידות קובעות חתך מינימלי.
 * המחיר נקבע לפי המחירון של הקבלן — לא לפי ספק מסוים.
 * הנוסחה צריכה רק: מטרים ריצה x מחיר למ'.
 */

// טבלת קורת תשתית פרגולה — לפי אורך L וריווח
const BASE_BEAM_TABLE = [
  { maxLength: 3.0, light_075: '5x10', light_100: '5x15', heavy_075: '5x15', heavy_100: '5x15' },
  { maxLength: 3.5, light_075: '5x15', light_100: '5x15', heavy_075: '5x15', heavy_100: '5x20' },
  { maxLength: 4.0, light_075: '5x15', light_100: '5x15', heavy_075: '5x20', heavy_100: '5x20' },
  { maxLength: 4.5, light_075: '5x15', light_100: '5x20', heavy_075: '5x20', heavy_100: '5x20' },
  { maxLength: 5.0, light_075: '5x20', light_100: '5x20', heavy_075: '5x20', heavy_100: '5x20' },
  { maxLength: 5.5, light_075: '5x20', light_100: '5x20', heavy_075: '5x20', heavy_100: '5x20' },
  { maxLength: 6.0, light_075: '5x20', light_100: '5x20', heavy_075: '5x20', heavy_100: '5x20' },
]

// טבלת תומך תשתית — לפי ספן W ואורך L
const SUPPORT_TABLE = [
  { maxSpan: 3, L3: '5x20', L4: '5x20', L5: '7x20', L6: '7x20' },
  { maxSpan: 4, L3: '7x20', L4: '7x20', L5: '7x20', L6: '7x20' },
  { maxSpan: 5, L3: '7x25', L4: '10x25', L5: '10x25', L6: '10x30' },
  { maxSpan: 6, L3: '10x25', L4: '10x30', L5: '10x30', L6: '15x30' },
  { maxSpan: 7, L3: '10x30', L4: '15x30', L5: '15x30', L6: '20x30' },
]

/**
 * מחירי ברירת מחדל לפי חתך — הקבלן יכול לשנות במחירון
 * האינדקס הוא ID במחירון (materials[].id)
 * הפורמט: חתך → { id: מזהה במחירון, defaultPrice: מחיר ברירת מחדל }
 */
const BEAM_DEFAULTS = {
  '5x10':  { id: 3, defaultPrice: 14.50 },
  '5x15':  { id: 4, defaultPrice: 22.09 },
  '5x20':  { id: 5, defaultPrice: 32 },
  '7x20':  { id: 6, defaultPrice: 45 },
  '7x25':  { id: 6, defaultPrice: 55 },
  '10x25': { id: 7, defaultPrice: 65 },
  '10x30': { id: 7, defaultPrice: 80 },
  '15x30': { id: 7, defaultPrice: 100 },
  '20x30': { id: 7, defaultPrice: 130 },
  '30x30': { id: 7, defaultPrice: 170 },
}

/**
 * שולף מחיר למ' של קורה — קודם מהמחירון, אחר כך ברירת מחדל
 * @param {string} section — חתך (למשל '5x15')
 * @param {Array} materials — מחירון הקבלן (אופציונלי)
 */
export function getBeamPrice(section, materials = []) {
  const def = BEAM_DEFAULTS[section]
  if (!def) return 22 // ברירת מחדל כללית

  // חפש במחירון לפי ID
  if (materials.length > 0 && def.id) {
    const mat = materials.find(m => m.id === def.id && m.is_active)
    if (mat) return Number(mat.price_per_unit)
  }

  return def.defaultPrice
}

/**
 * בחירת חתך קורת תשתית לפי אורך וריווח
 */
export function getBaseBeamSection(lengthL, spacing = 0.75, roofWeight = 'light') {
  const clamped = Math.min(6, Math.max(3, lengthL))
  const row = BASE_BEAM_TABLE.find(r => clamped <= r.maxLength) || BASE_BEAM_TABLE[BASE_BEAM_TABLE.length - 1]

  const key = spacing >= 1.0
    ? (roofWeight === 'heavy' ? 'heavy_100' : 'light_100')
    : (roofWeight === 'heavy' ? 'heavy_075' : 'light_075')

  const section = row[key]
  return { section }
}

/**
 * בחירת חתך תומך תשתית לפי ספן ואורך
 */
export function getSupportSection(widthW, lengthL) {
  const span = Math.min(7, Math.max(3, Math.ceil(widthW)))
  const lClamped = Math.min(6, Math.max(3, Math.ceil(lengthL)))
  const row = SUPPORT_TABLE.find(r => span <= r.maxSpan) || SUPPORT_TABLE[SUPPORT_TABLE.length - 1]
  const section = row[`L${lClamped}`] || row.L3
  return { section }
}

export const ROOF_BEAM_SPACING = 0.60
export const MAX_POST_SPAN = 3.0
