/**
 * טקסטים של הצעה שנגזרים מהחישוב בפועל — כדי שההצעה לא תבטיח משהו שלא חושב
 */

// מסיר מרשימת "כלול" פריטי בטון כשאין בטון בחומרים
export function filterIncluded(list, result) {
  const items = list || []
  if (!result?.includes || result.includes.concrete) return items
  return items.filter(item => !item.includes('בטון'))
}
