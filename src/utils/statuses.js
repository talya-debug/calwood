/**
 * סטטוסים של הצעה + חישובי הדשבורד
 * "מאושר" = הלקוח אישר, עוד לא שילם. "שולם" = הכסף נגבה.
 */
export const STATUSES = [
  { key: 'draft', text: 'טיוטה', dot: 'bg-[#717971]', bg: 'bg-[#e7e9e4] text-[#414942]' },
  { key: 'sent', text: 'נשלח', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700' },
  { key: 'approved', text: 'מאושר', dot: 'bg-[#2d5a3d]', bg: 'bg-[#bceec8]/30 text-[#144227]' },
  { key: 'paid', text: 'שולם', dot: 'bg-[#7a5900]', bg: 'bg-[#fdce6c]/30 text-[#7a5900]' },
  { key: 'rejected', text: 'נדחה', dot: 'bg-red-400', bg: 'bg-red-50 text-red-600' },
]

export function getStatus(key) {
  return STATUSES.find(s => s.key === key) || STATUSES[0]
}

// עבודה מאושרת = אושרה או שולמה (עבודה ששולמה היא גם עבודה שאושרה)
const isWon = (q) => q.status === 'approved' || q.status === 'paid'

export function dashboardStats(quotes, now = new Date()) {
  const thisMonth = quotes.filter(q => {
    const d = new Date(q.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const total = (q) => q.result?.totals?.total || 0
  const won = thisMonth.filter(isWon)
  return {
    monthCount: thisMonth.length,
    approvedTotal: won.reduce((s, q) => s + total(q), 0),
    collectedTotal: thisMonth.filter(q => q.status === 'paid').reduce((s, q) => s + total(q), 0),
    closeRate: thisMonth.length > 0 ? Math.round((won.length / thisMonth.length) * 100) : 0,
  }
}
