import { useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, MoreHorizontal, ChevronLeft } from 'lucide-react'
import { getQuotes, getProfile } from '../utils/storage'

const typeNames = { pergola: 'פרגולה', deck: 'דק' }

export default function Dashboard() {
  const { user } = useUser()
  const firstName = user?.firstName || 'קבלן'
  const quotes = getQuotes()
  const profile = getProfile()

  const thisMonth = quotes.filter(q => {
    const d = new Date(q.created_at); const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const approved = thisMonth.filter(q => q.status === 'approved')
  const totalRevenue = approved.reduce((sum, q) => sum + (q.result?.totals?.total || 0), 0)
  const fmt = (n) => Number(n || 0).toLocaleString('he-IL')
  const recentQuotes = quotes.slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'בוקר טוב,' : hour < 17 ? 'צהריים טובים,' : 'ערב טוב,'

  return (
    <>
      {/* ברכה — ירוק עם אווירה חמה */}
      <section className="relative bg-[#2d5a3d] text-white rounded-xl p-6 flex justify-between items-center overflow-hidden shadow-lg">
        <div className="z-10">
          <p className="text-[#9ed0ab] text-base">{greeting}</p>
          <h2 className="text-3xl font-extrabold mt-1">{firstName} {user?.lastName || ''}</h2>
        </div>
        {/* אילוסטרציה — עיגול דקורטיבי */}
        <div className="w-28 h-28 bg-[#9ed0ab]/20 rounded-full flex items-center justify-center text-5xl z-10">
          🪵
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#9ed0ab]/10 rounded-full blur-2xl"></div>
      </section>

      {/* CTA — טרקוטה (לא ירוק!) */}
      <Link to="/new-quote"
        className="w-full h-14 bg-[#C45D3E] text-white rounded-xl font-bold text-xl shadow-lg shadow-[#C45D3E]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:brightness-110">
        <Plus size={22} strokeWidth={2.5} /> הצעה חדשה
      </Link>

      {/* סטטיסטיקות — מספרים בצבע דבש */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-[#E8E4DB] rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#7a5900] text-2xl font-bold">₪{fmt(totalRevenue)}</span>
          <span className="text-[11px] font-bold text-[#717971] tracking-wider mt-1 uppercase">הכנסות</span>
        </div>
        <div className="bg-white border border-[#E8E4DB] rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#7a5900] text-2xl font-bold">{thisMonth.length}</span>
          <span className="text-[11px] font-bold text-[#717971] tracking-wider mt-1 uppercase">הצעות החודש</span>
        </div>
        <div className="bg-white border border-[#E8E4DB] rounded-xl p-4 flex flex-col items-center text-center">
          <span className="text-[#7a5900] text-2xl font-bold">{thisMonth.length > 0 ? Math.round((approved.length / thisMonth.length) * 100) : 0}%</span>
          <span className="text-[11px] font-bold text-[#717971] tracking-wider mt-1 uppercase">אחוז סגירה</span>
        </div>
      </section>

      {/* השלם פרופיל — צהוב/דבש */}
      {!profile.business_name && (
        <Link to="/settings"
          className="bg-[#fdce6c]/20 border-2 border-dashed border-[#fdce6c] rounded-xl p-5 flex items-center gap-4">
          <div className="bg-[#fdce6c] p-2.5 rounded-full text-[#7a5900]">
            <Plus size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#7a5900]">השלם את פרטי העסק שלך</h3>
            <p className="text-sm text-[#7a5900]/70">הוסף לוגו ופרטי קשר למסמכים מקצועיים</p>
          </div>
          <ChevronLeft size={20} className="text-[#7a5900]" />
        </Link>
      )}

      {/* הצעות אחרונות */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">הצעות אחרונות</h2>
          <Link to="/quotes" className="text-[#144227] text-xs font-bold flex items-center gap-1">צפה בהכל <ChevronLeft size={14} /></Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center space-y-4">
            <div className="text-5xl opacity-40">📋</div>
            <div>
              <h3 className="font-bold text-[#717971]">אין עדיין הצעות מחיר</h3>
              <p className="text-sm text-[#717971]/70 mt-1">התחל לעבוד וצור את ההצעה הראשונה שלך</p>
            </div>
            <Link to="/new-quote" className="bg-[#144227] text-white px-6 py-3 rounded-full font-bold text-sm">צור הצעה ראשונה</Link>
          </div>
        ) : (
          recentQuotes.map(quote => {
            const dims = quote.dimensions || {}
            const date = quote.created_at ? new Date(quote.created_at).toLocaleDateString('he-IL') : ''
            const s = quote.status || 'draft'
            const statusStyles = {
              draft: { bg: 'bg-stone-100 text-stone-600', dot: 'bg-stone-400', text: 'טיוטה' },
              sent: { bg: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', text: 'נשלח' },
              approved: { bg: 'bg-green-100 text-green-800', dot: 'bg-green-600', text: 'מאושר' },
              rejected: { bg: 'bg-red-50 text-red-600', dot: 'bg-red-400', text: 'נדחה' },
            }
            const st = statusStyles[s] || statusStyles.draft

            return (
              <div key={quote.id} className="bg-white border border-[#E8E4DB] rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">{typeNames[quote.type] || quote.type}</h4>
                    {quote.client?.name && <p className="text-sm text-[#717971]">{quote.client.name}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-bold text-lg text-[#144227]">₪{fmt(quote.result?.totals?.total)}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${st.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                      {st.text}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#E8E4DB] flex justify-between items-center text-[#717971] text-xs">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {date}</span>
                  <button className="p-1 hover:bg-stone-50 rounded-lg"><MoreHorizontal size={16} /></button>
                </div>
              </div>
            )
          })
        )}
      </section>
    </>
  )
}
