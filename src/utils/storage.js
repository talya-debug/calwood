/**
 * שמירה מקומית — עד שנחבר ל-Supabase
 * כל הנתונים נשמרים ב-localStorage לפי user
 */

const PREFIX = 'woodcalc_'
const MATERIALS_VERSION = 4 // עדכון גרסה מאלץ טעינת מחירון חדש

export function save(key, data) {
  localStorage.setItem(PREFIX + key, JSON.stringify(data))
}

export function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function remove(key) {
  localStorage.removeItem(PREFIX + key)
}

// --- פרופיל קבלן ---
export function getProfile() {
  return load('profile', {
    business_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    license_number: '',
    hourly_rate: 250,
    helper_daily: 900,
    overhead_pct: 5,
    profit_pct: 20,
    safety_pct: 5,
    supplier_discount: 0,
  })
}

export function saveProfile(profile) {
  save('profile', profile)
}

// --- מיתוג ---
export function getBranding() {
  return load('branding', {
    logo_url: '',
    brand_color: '#1F3864',
    quote_title: 'הצעת מחיר',
    payment_terms: '40% מקדמה בתחילת העבודה, 60% בסיום',
    warranty_text: 'אחריות 5 שנים על עבודה',
    validity_text: 'ההצעה בתוקף ל-14 יום',
    included_list: ['חומרים', 'עבודה', 'הובלה לאתר', 'שימון/לכה', 'בסיסי בטון'],
    excluded_list: ['תאורה / חשמל בפרגולה', 'ניקוז / אינסטלציה מתחת לדק', 'פינוי עודפי חומרים', 'הכנת שטח / פיזור אדמה'],
  })
}

export function saveBranding(branding) {
  save('branding', branding)
}

// --- מחירון חומרים ---
let _materialsVersionChecked = false
export function getMaterials() {
  // בדיקת גרסה — רק פעם אחת בטעינה
  if (!_materialsVersionChecked) {
    const ver = load('materials_version', 0)
    if (ver < MATERIALS_VERSION) {
      remove('materials')
      save('materials_version', MATERIALS_VERSION)
    }
    _materialsVersionChecked = true
  }
  return load('materials', [
    // === עמודים ===
    // piece_length = אורך יחידה מהספק (מטר). המנוע מחשב כמה יחידות צריך.
    // price_per_unit = מחיר למ' ריצה. width/height = חתך בס"מ.
    { id: 1, category: 'עמודים', name: 'עמוד 15x15', width: 15, height: 15, piece_length: 3, unit: "₪/מ'", price_per_unit: 78, supplier: '', is_active: true },
    { id: 2, category: 'עמודים', name: 'עמוד 20x20', width: 20, height: 20, piece_length: 3, unit: "₪/מ'", price_per_unit: 138, supplier: '', is_active: true },

    // === קורות מבנה ===
    // הטבלה ההנדסית בוחרת חתך לפי ספן. הקבלן מגדיר מידות ומחיר לפי הספק שלו.
    { id: 3, category: 'קורות', name: 'קורה 5x10', width: 5, height: 10, piece_length: 4, unit: "₪/מ'", price_per_unit: 14.50, supplier: '', is_active: true },
    { id: 4, category: 'קורות', name: 'קורה 5x15', width: 5, height: 15, piece_length: 4, unit: "₪/מ'", price_per_unit: 22.09, supplier: '', is_active: true },
    { id: 5, category: 'קורות', name: 'קורה 5x20', width: 5, height: 20, piece_length: 4, unit: "₪/מ'", price_per_unit: 32, supplier: '', is_active: true },
    { id: 6, category: 'קורות', name: 'קורה 7x20', width: 7, height: 20, piece_length: 4, unit: "₪/מ'", price_per_unit: 45, supplier: '', is_active: true },
    { id: 7, category: 'קורות', name: 'קורה 10x25', width: 10, height: 25, piece_length: 4, unit: "₪/מ'", price_per_unit: 65, supplier: '', is_active: true },

    // === לוחות דק ===
    // piece_length = אורך הלוח שהספק מוכר. board_width = רוחב נטו (ס"מ).
    { id: 10, category: 'לוחות דק', name: 'דק אורן', width: 16, height: 4, piece_length: 3.6, board_width: 15.5, unit: "₪/מ'", price_per_unit: 12, supplier: '', is_active: true },
    { id: 11, category: 'לוחות דק', name: 'דק במבוק כהה', width: 13.7, height: 2, piece_length: 1.85, board_width: 14.2, unit: "₪/מ'", price_per_unit: 38.94, supplier: '', is_active: true },
    { id: 12, category: 'לוחות דק', name: 'דק במבוק בהיר', width: 13.7, height: 2, piece_length: 1.85, board_width: 14.2, unit: "₪/מ'", price_per_unit: 43.66, supplier: '', is_active: true },
    { id: 13, category: 'לוחות דק', name: 'דק איפאה', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 64.90, supplier: '', is_active: true },
    { id: 14, category: 'לוחות דק', name: 'דק איפאה פרמיום', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 70.80, supplier: '', is_active: true },
    { id: 15, category: 'לוחות דק', name: 'דק קומרו', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 47.20, supplier: '', is_active: true },
    { id: 16, category: 'לוחות דק', name: 'דק סוקופירה', width: 14, height: 1.9, piece_length: 2.2, board_width: 14.5, unit: "₪/מ'", price_per_unit: 40.12, supplier: '', is_active: true },

    // === קירוי ===
    { id: 20, category: 'קירוי', name: 'סנטף שקוף/ברונזה', width: 126, height: 0, piece_length: 0, unit: '₪/מ"ר', price_per_unit: 46.61, supplier: '', is_active: true },
    { id: 21, category: 'קירוי', name: 'BH גלי עבה', width: 104.5, height: 0, piece_length: 0, unit: '₪/מ"ר', price_per_unit: 103.84, supplier: '', is_active: true },
    { id: 22, category: 'קירוי', name: 'עץ טרמו', width: 14, height: 2.6, piece_length: 3, unit: "₪/מ'", price_per_unit: 28.32, supplier: '', is_active: true },

    // === ברגים וחיבורים ===
    { id: 30, category: 'ברגים וחיבורים', name: 'ברגים פרגולה שלד', width: 0, height: 0, piece_length: 0, pack_size: 1, unit: 'סט', price_per_unit: 500, supplier: '', is_active: true },
    { id: 31, category: 'ברגים וחיבורים', name: 'ברגי דק אורן', width: 0, height: 0, piece_length: 0, pack_size: 400, unit: 'חבילה', price_per_unit: 170, supplier: '', is_active: true },
    { id: 32, category: 'ברגים וחיבורים', name: 'ברגי דק במבוק', width: 0, height: 0, piece_length: 0, pack_size: 80, unit: 'חבילה', price_per_unit: 135, supplier: '', is_active: true },
    { id: 33, category: 'ברגים וחיבורים', name: 'ברגי BH קירוי', width: 0, height: 0, piece_length: 0, pack_size: 400, unit: 'חבילה', price_per_unit: 400, supplier: '', is_active: true },
    { id: 34, category: 'ברגים וחיבורים', name: 'תושבת עמוד/קיר', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 28, supplier: '', is_active: true },

    // === חומרי עזר ===
    { id: 40, category: 'חומרי עזר', name: 'שמן/שימון', width: 0, height: 0, piece_length: 0, coverage: 1, unit: 'לפרויקט', price_per_unit: 400, supplier: '', is_active: true },
    { id: 41, category: 'חומרי עזר', name: 'זפת', width: 0, height: 0, piece_length: 0, coverage: 250, unit: 'דלי', price_per_unit: 162, supplier: '', is_active: true },

    // === תשתית ===
    { id: 50, category: 'תשתית', name: 'שק בטון', width: 0, height: 0, piece_length: 0, unit: 'שק', price_per_unit: 30, supplier: '', is_active: true },
    { id: 51, category: 'תשתית', name: 'אקרשטיין (בסיס רגל)', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 3, supplier: '', is_active: true },

    // === נסיעות ===
    { id: 70, category: 'נסיעות', name: 'קרוב (עד 20 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 200, supplier: '', is_active: true },
    { id: 71, category: 'נסיעות', name: 'בינוני (20-40 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 350, supplier: '', is_active: true },
    { id: 72, category: 'נסיעות', name: 'רחוק (מעל 40 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 500, supplier: '', is_active: true },

    // === אחר ===
    { id: 80, category: 'אחר', name: 'מדרגה (חומר+עבודה)', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 800, supplier: '', is_active: true },
  ])
}

export function saveMaterials(materials) {
  save('materials', materials)
}

// --- הצעות מחיר ---
export function getQuotes() {
  return load('quotes', [])
}

export function saveQuote(quote) {
  const quotes = getQuotes()
  quote.id = quote.id || Date.now()
  quote.created_at = quote.created_at || new Date().toISOString()
  const idx = quotes.findIndex(q => q.id === quote.id)
  if (idx >= 0) {
    quotes[idx] = quote
  } else {
    quotes.unshift(quote)
  }
  save('quotes', quotes)
  return quote
}

export function deleteQuote(id) {
  save('quotes', getQuotes().filter(q => q.id !== id))
}

// --- לקוחות ---
export function getClients() {
  return load('clients', [])
}

export function saveClient(client) {
  const clients = getClients()
  client.id = client.id || Date.now()
  const idx = clients.findIndex(c => c.id === client.id)
  if (idx >= 0) {
    clients[idx] = client
  } else {
    clients.unshift(client)
  }
  save('clients', clients)
  return client
}

export function deleteClient(id) {
  save('clients', getClients().filter(c => c.id !== id))
}
