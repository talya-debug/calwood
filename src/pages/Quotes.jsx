import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getQuotes, deleteQuote, saveQuote, getProfile, getBranding, deleteQuoteAndSync, updateQuoteStatusAndSync } from '../utils/storage'
import { Trash2, Download, Search, Plus, ChevronDown, Calendar, MoreHorizontal } from 'lucide-react'
import { generateQuotePDF } from '../utils/pdf'

const STATUSES = [
  { key: 'draft', text: 'טיוטה', dot: 'bg-[#717971]', bg: 'bg-[#e7e9e4] text-[#414942]' },
  { key: 'sent', text: 'נשלח', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700' },
  { key: 'approved', text: 'מאושר', dot: 'bg-[#2d5a3d]', bg: 'bg-[#bceec8]/30 text-[#144227]' },
  { key: 'rejected', text: 'נדחה', dot: 'bg-red-400', bg: 'bg-red-50 text-red-600' },
]
const typeNames = { pergola: 'פרגולה', deck: 'דק' }

export default function Quotes() {
  const [quotes, setQuotes] = useState(getQuotes)
  const [search, setSearch] = useState('')
  const [statusMenu, setStatusMenu] = useState(null)

  const filtered = quotes.filter(q => {
    if (!search) return true
    return (q.client?.name || '').includes(search) || (typeNames[q.type] || '').includes(search)
  })

  const handleDelete = (id) => { deleteQuoteAndSync(id); setQuotes(getQuotes()) }
  const handleStatus = (id, s) => { const q = quotes.find(x => x.id === id); if (q) { q.status = s; saveQuote(q); updateQuoteStatusAndSync(q); setQuotes(getQuotes()) }; setStatusMenu(null) }
  const fmt = (n) => Number(n || 0).toLocaleString('he-IL')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/new-quote" className="flex items-center gap-1.5 text-sm bg-[#2d5a3d] text-white px-4 py-2.5 rounded-2xl font-bold">
          <Plus size={16} /> הצעה חדשה
        </Link>
        <div className="text-right">
          <h2 className="text-2xl font-extrabold text-[#1a1c1a]">הצעות מחיר</h2>
          <p className="text-xs text-[#717971]">ניהול ומעקב אחר פרויקטים</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717971]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם לקוח או פרויקט..."
          className="w-full h-12 pr-11 pl-4 border border-[#c1c9c0] rounded-2xl bg-white text-sm focus:border-[#2d5a3d] focus:border-2 outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e7e9e4] p-10 text-center">
          <div className="w-16 h-16 bg-[#edeeea] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">📋</div>
          <p className="font-medium text-[#414942]">{quotes.length === 0 ? 'פה יופיעו כל ההצעות שלך' : 'לא נמצאו תוצאות'}</p>
          {quotes.length === 0 && <Link to="/new-quote" className="inline-block mt-3 text-[#2d5a3d] font-bold text-sm">צור הצעה ראשונה</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(quote => {
            const status = STATUSES.find(s => s.key === quote.status) || STATUSES[0]
            const dims = quote.dimensions || {}
            const date = quote.created_at ? new Date(quote.created_at).toLocaleDateString('he-IL') : ''

            return (
              <div key={quote.id} className="bg-white rounded-2xl border border-[#e7e9e4] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    <button onClick={() => setStatusMenu(statusMenu === quote.id ? null : quote.id)}
                      className={`text-[11px] px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${status.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                      {status.text} <ChevronDown size={12} />
                    </button>
                    {statusMenu === quote.id && (
                      <div className="absolute top-8 left-0 bg-white rounded-xl shadow-lg border border-[#e7e9e4] py-1 z-20 min-w-[100px]">
                        {STATUSES.map(s => (
                          <button key={s.key} onClick={() => handleStatus(quote.id, s.key)}
                            className="w-full text-right px-4 py-2 text-sm hover:bg-[#f3f4ef] flex items-center gap-2 justify-end">
                            {s.text} <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-[#1a1c1a] text-base">
                      {typeNames[quote.type]} {dims.width && dims.length ? `(${dims.length}x${dims.width})` : ''}
                    </h4>
                    {quote.client?.name && <p className="text-sm text-[#717971]">{quote.client.name}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#edeeea] pt-2">
                  <div className="flex items-center gap-2 text-[#717971]">
                    <button onClick={() => handleDelete(quote.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                    <button onClick={() => generateQuotePDF(quote.result, quote.client, getProfile(), getBranding())} className="text-[#2d5a3d] p-1"><Download size={14} /></button>
                    <span className="text-xs flex items-center gap-1"><Calendar size={12} /> {date}</span>
                  </div>
                  <span className="text-xl font-bold text-[#2d5a3d]">{fmt(quote.result?.totals?.total)}₪</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
