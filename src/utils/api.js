/**
 * שכבת API — מתקשר עם Vercel serverless functions
 * כל הנתונים נשמרים ב-Neon, לפי clerk_id
 * localStorage משמש כקאש מקומי בלבד
 */

const PREFIX = 'calwood_'

// שליפת clerk user id
function getClerkUserId() {
  // נשמר על ידי SyncWrapper ב-App.jsx
  if (window.__clerkUserId) return window.__clerkUserId
  if (window.Clerk?.user?.id) return window.Clerk.user.id
  return ''
}

async function apiFetch(path, options = {}) {
  const userId = getClerkUserId()
  const res = await fetch(`/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// === קאש מקומי ===
function cacheSet(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(data)) } catch {}
}
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// === פרופיל ===
export async function fetchProfile() {
  try {
    const profile = await apiFetch('profile')
    cacheSet('profile', profile)
    return profile
  } catch {
    return cacheGet('profile') || getDefaultProfile()
  }
}

export async function updateProfile(data) {
  try {
    const profile = await apiFetch('profile', { method: 'PUT', body: data })
    cacheSet('profile', profile)
    return profile
  } catch {
    // שומר מקומית אם אין חיבור
    cacheSet('profile', { ...cacheGet('profile'), ...data })
    return cacheGet('profile')
  }
}

// === מחירון ===
export async function fetchMaterials() {
  try {
    const materials = await apiFetch('materials')
    if (materials.length > 0) {
      // ממפה mat_id ל-id לתאימות עם המנועים
      const mapped = materials.map(m => ({ ...m, id: m.mat_id }))
      cacheSet('materials', mapped)
      return mapped
    }
    // אין חומרים ב-DB — מחזיר דיפולט
    return getDefaultMaterials()
  } catch {
    return cacheGet('materials') || getDefaultMaterials()
  }
}

export async function saveMaterialsToServer(items) {
  try {
    await apiFetch('materials', { method: 'POST', body: items })
    cacheSet('materials', items)
  } catch {
    cacheSet('materials', items)
  }
}

// === לקוחות ===
export async function fetchClients() {
  try {
    const clients = await apiFetch('clients')
    cacheSet('clients', clients)
    return clients
  } catch {
    return cacheGet('clients') || []
  }
}

export async function createClient(data) {
  try {
    const client = await apiFetch('clients', { method: 'POST', body: data })
    return client
  } catch {
    // fallback מקומי
    const clients = cacheGet('clients') || []
    const newClient = { ...data, id: Date.now().toString() }
    clients.unshift(newClient)
    cacheSet('clients', clients)
    return newClient
  }
}

export async function removeClient(id) {
  try {
    await apiFetch(`clients?id=${id}`, { method: 'DELETE' })
  } catch {}
}

// === הצעות ===
export async function fetchQuotes() {
  try {
    const quotes = await apiFetch('quotes')
    cacheSet('quotes', quotes)
    return quotes
  } catch {
    return cacheGet('quotes') || []
  }
}

export async function createQuote(data) {
  try {
    const quote = await apiFetch('quotes', { method: 'POST', body: data })
    return quote
  } catch {
    const quotes = cacheGet('quotes') || []
    const newQuote = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() }
    quotes.unshift(newQuote)
    cacheSet('quotes', quotes)
    return newQuote
  }
}

export async function updateQuote(data) {
  try {
    return await apiFetch('quotes', { method: 'PUT', body: data })
  } catch {}
}

export async function removeQuote(id) {
  try {
    await apiFetch(`quotes?id=${id}`, { method: 'DELETE' })
  } catch {}
}

// === ברירות מחדל ===
function getDefaultProfile() {
  return {
    business_name: '', owner_name: '', phone: '', email: '', address: '', license_number: '',
    hourly_rate: 250, helper_daily: 900, overhead_pct: 5, profit_pct: 20, safety_pct: 5,
    supplier_discount: 0, pergola_days_with_helper: 3, pergola_days_alone: 5,
    deck_days_with_helper: 2, deck_days_alone: 3.5,
    logo_url: '', brand_color: '#2d5a3d', quote_title: 'הצעת מחיר',
    payment_terms: '40% מקדמה בתחילת העבודה, 60% בסיום',
    warranty_text: 'אחריות 5 שנים על עבודה', validity_text: 'ההצעה בתוקף ל-14 יום',
    included_list: ['חומרים', 'עבודה', 'הובלה לאתר', 'שימון/לכה', 'בסיסי בטון'],
    excluded_list: ['תאורה / חשמל בפרגולה', 'ניקוז / אינסטלציה מתחת לדק', 'פינוי עודפי חומרים', 'הכנת שטח / פיזור אדמה'],
    onboarding_done: false,
  }
}

function getDefaultMaterials() {
  // אותו מחירון דיפולט כמו שהיה ב-storage.js
  return [
    { id: 1, category: 'עמודים', name: 'עמוד 15x15', width: 15, height: 15, piece_length: 3, unit: "₪/מ'", price_per_unit: 78, supplier: '', is_active: true },
    { id: 2, category: 'עמודים', name: 'עמוד 20x20', width: 20, height: 20, piece_length: 3, unit: "₪/מ'", price_per_unit: 138, supplier: '', is_active: true },
    { id: 3, category: 'קורות', name: 'קורה 5x10', width: 5, height: 10, piece_length: 4, unit: "₪/מ'", price_per_unit: 14.50, supplier: '', is_active: true },
    { id: 4, category: 'קורות', name: 'קורה 5x15', width: 5, height: 15, piece_length: 4, unit: "₪/מ'", price_per_unit: 22.09, supplier: '', is_active: true },
    { id: 5, category: 'קורות', name: 'קורה 5x20', width: 5, height: 20, piece_length: 4, unit: "₪/מ'", price_per_unit: 32, supplier: '', is_active: true },
    { id: 6, category: 'קורות', name: 'קורה 7x20', width: 7, height: 20, piece_length: 4, unit: "₪/מ'", price_per_unit: 45, supplier: '', is_active: true },
    { id: 7, category: 'קורות', name: 'קורה 10x25', width: 10, height: 25, piece_length: 4, unit: "₪/מ'", price_per_unit: 65, supplier: '', is_active: true },
    { id: 10, category: 'לוחות דק', name: 'דק אורן', width: 16, height: 4, piece_length: 3.6, board_width: 15.5, unit: "₪/מ'", price_per_unit: 12, supplier: '', is_active: true },
    { id: 11, category: 'לוחות דק', name: 'דק במבוק כהה', width: 13.7, height: 2, piece_length: 1.85, board_width: 14.2, unit: "₪/מ'", price_per_unit: 38.94, supplier: '', is_active: true },
    { id: 12, category: 'לוחות דק', name: 'דק במבוק בהיר', width: 13.7, height: 2, piece_length: 1.85, board_width: 14.2, unit: "₪/מ'", price_per_unit: 43.66, supplier: '', is_active: true },
    { id: 13, category: 'לוחות דק', name: 'דק איפאה', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 64.90, supplier: '', is_active: true },
    { id: 14, category: 'לוחות דק', name: 'דק איפאה פרמיום', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 70.80, supplier: '', is_active: true },
    { id: 15, category: 'לוחות דק', name: 'דק קומרו', width: 15, height: 2.5, piece_length: 2.2, board_width: 15, unit: "₪/מ'", price_per_unit: 47.20, supplier: '', is_active: true },
    { id: 16, category: 'לוחות דק', name: 'דק סוקופירה', width: 14, height: 1.9, piece_length: 2.2, board_width: 14.5, unit: "₪/מ'", price_per_unit: 40.12, supplier: '', is_active: true },
    { id: 20, category: 'קירוי', name: 'סנטף שקוף/ברונזה', width: 126, height: 0, piece_length: 0, unit: '₪/מ"ר', price_per_unit: 46.61, supplier: '', is_active: true },
    { id: 21, category: 'קירוי', name: 'BH גלי עבה', width: 104.5, height: 0, piece_length: 0, unit: '₪/מ"ר', price_per_unit: 103.84, supplier: '', is_active: true },
    { id: 22, category: 'קירוי', name: 'עץ טרמו', width: 14, height: 2.6, piece_length: 3, unit: "₪/מ'", price_per_unit: 28.32, supplier: '', is_active: true },
    { id: 30, category: 'ברגים וחיבורים', name: 'ברגים פרגולה שלד', width: 0, height: 0, piece_length: 0, pack_size: 1, unit: 'סט', price_per_unit: 500, supplier: '', is_active: true },
    { id: 31, category: 'ברגים וחיבורים', name: 'ברגי דק אורן', width: 0, height: 0, piece_length: 0, pack_size: 400, unit: 'חבילה', price_per_unit: 170, supplier: '', is_active: true },
    { id: 32, category: 'ברגים וחיבורים', name: 'ברגי דק במבוק', width: 0, height: 0, piece_length: 0, pack_size: 80, unit: 'חבילה', price_per_unit: 135, supplier: '', is_active: true },
    { id: 33, category: 'ברגים וחיבורים', name: 'ברגי BH קירוי', width: 0, height: 0, piece_length: 0, pack_size: 400, unit: 'חבילה', price_per_unit: 400, supplier: '', is_active: true },
    { id: 34, category: 'ברגים וחיבורים', name: 'תושבת עמוד/קיר', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 28, supplier: '', is_active: true },
    { id: 40, category: 'חומרי עזר', name: 'שמן/שימון', width: 0, height: 0, piece_length: 0, coverage: 1, unit: 'לפרויקט', price_per_unit: 400, supplier: '', is_active: true },
    { id: 41, category: 'חומרי עזר', name: 'זפת', width: 0, height: 0, piece_length: 0, coverage: 250, unit: 'דלי', price_per_unit: 162, supplier: '', is_active: true },
    { id: 50, category: 'תשתית', name: 'שק בטון', width: 0, height: 0, piece_length: 0, unit: 'שק', price_per_unit: 30, supplier: '', is_active: true },
    { id: 51, category: 'תשתית', name: 'אקרשטיין (בסיס רגל)', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 3, supplier: '', is_active: true },
    { id: 70, category: 'נסיעות', name: 'קרוב (עד 20 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 200, supplier: '', is_active: true },
    { id: 71, category: 'נסיעות', name: 'בינוני (20-40 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 350, supplier: '', is_active: true },
    { id: 72, category: 'נסיעות', name: 'רחוק (מעל 40 ק"מ)', width: 0, height: 0, piece_length: 0, unit: '₪', price_per_unit: 500, supplier: '', is_active: true },
    { id: 80, category: 'אחר', name: 'מדרגה (חומר+עבודה)', width: 0, height: 0, piece_length: 0, unit: "יח'", price_per_unit: 800, supplier: '', is_active: true },
  ]
}
