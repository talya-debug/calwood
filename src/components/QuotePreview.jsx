import { useState } from 'react'
import { X, Download, Edit3, Check } from 'lucide-react'
import { generateQuotePDF } from '../utils/pdf'

function fmt(n) { return Number(n || 0).toLocaleString('he-IL') }

export default function QuotePreview({ result, client, profile, branding, onClose }) {
  const dims = result.dimensions || {}
  const woodNames = { pine: 'אורן', bamboo_d: 'במבוק כהה', bamboo_l: 'במבוק בהיר', ipe: 'איפאה', ipe_prem: 'איפאה פרמיום', cumaru: 'קומרו', sucupira: 'סוקופירה' }
  const roofNames = { santef: 'סנטף', bh: 'BH פוליקרבונט', thermo: 'עץ טרמו' }
  const heightNames = { low: 'צמוד קרקע', mid: '30-60 ס"מ', high: 'מעל 60 ס"מ' }

  const buildDesc = () => {
    const l = []
    if (result.type === 'pergola') {
      l.push(`בניית והתקנת פרגולת עץ ${dims.attachType === 'wall' ? 'צמודת קיר' : 'עצמאית'}`)
      l.push(`מידות: ${dims.length}x${dims.width} מ' (${fmt(result.area)} מ"ר) | גובה ${dims.height} מ'`)
      l.push(`כולל: עמודים, קורות תשתית וגג, בסיסי בטון, ברגים, תושבות, שימון`)
      if (dims.roofType && dims.roofType !== 'none') l.push(`קירוי: ${roofNames[dims.roofType]}`)
    } else {
      l.push(`התקנת דק ${woodNames[dims.woodType] || 'עץ'}`)
      l.push(`מידות: ${dims.length}x${dims.width} מ' (${fmt(result.area)} מ"ר) | גובה: ${heightNames[dims.height] || ''}`)
      l.push(`כולל: לוחות דק, קורות תשתית, ברגים, זפת, שימון`)
      if (dims.stairs > 0) l.push(`${dims.stairs} מדרגות`)
    }
    return l.join('\n')
  }

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(branding.quote_title || 'הצעת מחיר')
  const [greeting, setGreeting] = useState(client?.name ? `שלום ${client.name},\nתודה רבה על פנייתך. שמחתי לבקר באתר ולהעריך את הפרויקט.\nלהלן הצעת המחיר המפורטת:` : 'להלן הצעת מחיר:')
  const [workDesc, setWorkDesc] = useState(buildDesc)
  const [included, setIncluded] = useState((branding.included_list || []).join('\n'))
  const [excluded, setExcluded] = useState((branding.excluded_list || []).join('\n'))
  const [paymentTerms, setPaymentTerms] = useState(branding.payment_terms || '')
  const [warranty, setWarranty] = useState(branding.warranty_text || '')
  const [validity, setValidity] = useState(branding.validity_text || '')
  const [notes, setNotes] = useState('')
  const [timeline, setTimeline] = useState(`משך ביצוע: ${result.labor?.days || 3} ימי עבודה`)
  const [closing, setClosing] = useState(`אשמח לעמוד לרשותך לכל שאלה.\nבברכה,\n${profile.owner_name || profile.business_name || ''}`)

  const dateStr = new Date().toLocaleDateString('he-IL')

  const handleDownload = () => {
    const cb = { ...branding, quote_title: title, payment_terms: paymentTerms, warranty_text: warranty, validity_text: validity,
      included_list: included.split('\n').filter(Boolean), excluded_list: excluded.split('\n').filter(Boolean) }
    const cr = { ...result, _customGreeting: greeting, _customDesc: workDesc, _customNotes: notes, _customTimeline: timeline, _customClosing: closing, _customDetails: '' }
    generateQuotePDF(cr, client, profile, cb)
  }

  const E = ({ value, onChange, multi, className = '' }) => {
    if (!editing) return multi ? <div className={`whitespace-pre-line ${className}`}>{value}</div> : <span className={className}>{value}</span>
    return multi
      ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={`w-full border border-dashed border-[#2d5a3d]/30 rounded-lg px-3 py-2 outline-none resize-none ${className}`} />
      : <input value={value} onChange={e => onChange(e.target.value)} className={`w-full border-b border-dashed border-[#2d5a3d]/30 outline-none ${className}`} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-3 px-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
        {/* סרגל */}
        <div className="bg-[#2d5a3d] text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-10">
          <button onClick={onClose} className="p-1"><X size={18} /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(!editing)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${editing ? 'bg-white text-[#2d5a3d]' : 'bg-white/15'}`}>
              {editing ? <><Check size={12} /> סיום</> : <><Edit3 size={12} /> ערוך</>}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1 px-4 py-1.5 bg-[#fdce6c] text-[#7a5900] rounded-lg text-xs font-bold">
              <Download size={12} /> PDF
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-sm" dir="rtl">
          {/* כותרת עסק */}
          <div className="flex justify-between items-start pb-3 border-b-2 border-[#2d5a3d]">
            <span className="text-[10px] text-[#717971]">{dateStr}</span>
            <div className="text-right">
              {branding.logo_url && <img src={branding.logo_url} className="max-h-10 mb-1" alt="" />}
              <div className="text-lg font-bold text-[#2d5a3d]">{profile.business_name || 'CalWood'}</div>
              <div className="text-[10px] text-[#717971]">{[profile.phone, profile.email].filter(Boolean).join(' | ')}</div>
            </div>
          </div>

          {/* כותרת */}
          <div className="text-center">
            <E value={title} onChange={setTitle} className="text-2xl font-extrabold text-[#2d5a3d]" />
          </div>

          {/* פנייה */}
          <div className="bg-[#f3f4ef] rounded-xl p-3">
            <E value={greeting} onChange={setGreeting} multi className="text-[#414942] text-xs leading-relaxed" />
          </div>

          {/* תיאור */}
          <div>
            <div className="text-xs font-bold text-[#2d5a3d] mb-1 border-b border-[#2d5a3d] pb-1">תיאור העבודה</div>
            <div className="border rounded-lg p-3">
              <E value={workDesc} onChange={setWorkDesc} multi className="text-[#414942] text-xs leading-loose" />
            </div>
          </div>

          {editing && <E value={notes} onChange={setNotes} multi className="text-xs text-[#717971]" />}
          {!editing && notes && <div className="text-xs text-[#717971] bg-[#f3f4ef] rounded-lg p-2">{notes}</div>}

          {/* מחיר — קומפקטי */}
          <div className="border-2 border-[#2d5a3d] rounded-xl overflow-hidden">
            <div className="p-3 bg-[#2d5a3d]/5 flex justify-around text-center">
              <div><div className="text-[10px] text-[#717971]">שטח</div><div className="text-base font-bold">{fmt(result.area)} מ"ר</div></div>
              <div className="border-r border-[#e7e9e4]"></div>
              <div><div className="text-[10px] text-[#717971]">₪/מ"ר</div><div className="text-base font-bold">{fmt(result.totals.pricePerSqm)}</div></div>
              <div className="border-r border-[#e7e9e4]"></div>
              <div><div className="text-[10px] text-[#717971]">ימי עבודה</div><div className="text-base font-bold">{result.labor?.days}</div></div>
            </div>
            <div className="p-3 text-center border-t border-[#2d5a3d]/10">
              <div className="text-xs text-[#717971]">לפני מע"מ: {fmt(result.totals.beforeVat)}₪</div>
            </div>
            <div className="p-4 bg-[#bceec8]/20 text-center">
              <div className="text-[10px] text-[#717971]">מע"מ (18%): {fmt(result.totals.vat)}₪</div>
              <div className="text-3xl font-extrabold text-[#2d5a3d] mt-1">{fmt(result.totals.total)}₪</div>
              <div className="text-xs text-[#2d5a3d] font-medium">סה"כ כולל מע"מ</div>
            </div>
          </div>

          {/* לו"ז */}
          <div className="text-xs"><strong className="text-[#414942]">לוח זמנים: </strong><E value={timeline} onChange={setTimeline} className="text-[#717971] text-xs" /></div>

          {/* כלול / לא כלול */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#bceec8]/10 rounded-xl p-3">
              <div className="text-xs font-bold text-[#2d5a3d] mb-1">כלול</div>
              {editing ? <textarea value={included} onChange={e => setIncluded(e.target.value)} rows={4} className="w-full border border-dashed border-[#2d5a3d]/20 rounded px-2 py-1 text-[11px] outline-none resize-none" />
                : <div className="text-[11px] text-[#414942] space-y-0.5">{included.split('\n').filter(Boolean).map((x, i) => <div key={i}>- {x}</div>)}</div>}
            </div>
            <div className="bg-[#f3f4ef] rounded-xl p-3">
              <div className="text-xs font-bold text-[#717971] mb-1">לא כלול</div>
              {editing ? <textarea value={excluded} onChange={e => setExcluded(e.target.value)} rows={4} className="w-full border border-dashed border-gray-300 rounded px-2 py-1 text-[11px] outline-none resize-none" />
                : <div className="text-[11px] text-[#717971] space-y-0.5">{excluded.split('\n').filter(Boolean).map((x, i) => <div key={i}>- {x}</div>)}</div>}
            </div>
          </div>

          {/* תנאים */}
          <div className="border-t border-[#edeeea] pt-3 space-y-1 text-[11px] text-[#717971]">
            <div><strong className="text-[#414942]">תשלום: </strong><E value={paymentTerms} onChange={setPaymentTerms} className="text-[11px]" /></div>
            <div><strong className="text-[#414942]">אחריות: </strong><E value={warranty} onChange={setWarranty} className="text-[11px]" /></div>
            <div><E value={validity} onChange={setValidity} className="text-[11px]" /></div>
          </div>

          {/* חתימה */}
          <div className="pt-2">
            <E value={closing} onChange={setClosing} multi className="text-xs text-[#414942]" />
          </div>
        </div>
      </div>
    </div>
  )
}
