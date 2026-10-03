/**
 * חיפוש טקסט פשוט — מתעלם מרווחים מיותרים ומאותיות גדולות/קטנות
 */
export function matchesSearch(query, ...fields) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  return fields.some(f => String(f ?? '').toLowerCase().includes(q))
}
