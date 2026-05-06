import { useState, useMemo } from 'react'
import { calculatePergola } from '../engine/pergola'
import { calculateDeck, WOOD_TYPES } from '../engine/deck'
import { getProfile, getBranding, getClients, saveQuote, saveClient, saveQuoteAndSync, saveClientAndSync } from '../utils/storage'
import { generateMaterialsPDF } from '../utils/pdf'
import QuotePreview from '../components/QuotePreview'
import { ChevronDown, ChevronUp, Save, Check, UserPlus, Search, ClipboardList, FileText, Settings2 } from 'lucide-react'
import PergolaSketch from '../components/PergolaSketch'
import DeckSketch from '../components/DeckSketch'

// === Step Indicator ===
function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-2">
      {[3, 2, 1].map(n => (
        <div key={n} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${n === current ? 'bg-[#2d5a3d] text-white shadow-md' : n < current ? 'bg-[#bceec8] text-[#144227]' : 'bg-[#e7e9e4] text-[#717971]'}`}>
            {n < current ? '✓' : n}
          </div>
          {n > 1 && <div className={`w-12 h-0.5 ${n <= current ? 'bg-[#2d5a3d]' : 'bg-[#e7e9e4]'}`} />}
        </div>
      ))}
    </div>
  )
}

// === SVG Icons ===
function PergolaIcon({ active }) {
  const c = active ? '#2d5a3d' : '#c1c9c0'
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16">
      <rect x="10" y="24" width="5" height="32" rx="1.5" fill={c} opacity="0.8" />
      <rect x="49" y="24" width="5" height="32" rx="1.5" fill={c} opacity="0.8" />
      <rect x="8" y="20" width="48" height="5" rx="2" fill={c} />
      {[18, 28, 38, 48].map(x => <rect key={x} x={x} y="14" width="2.5" height="10" rx="0.5" fill={c} opacity="0.5" />)}
      <rect x="14" y="14" width="36" height="3" rx="1" fill={c} opacity="0.6" />
      <line x1="6" y1="56" x2="58" y2="56" stroke={c} strokeWidth="2" opacity="0.3" />
    </svg>
  )
}

function DeckIcon({ active }) {
  const c = active ? '#2d5a3d' : '#c1c9c0'
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16">
      {[16, 24, 32, 40, 48].map(y => <rect key={y} x="8" y={y} width="48" height="5" rx="1.5" fill={c} opacity="0.35" />)}
      <rect x="8" y="16" width="48" height="37" rx="3" fill="none" stroke={c} strokeWidth="2.5" />
      <rect x="16" y="53" width="4" height="8" rx="1" fill={c} opacity="0.6" />
      <rect x="30" y="53" width="4" height="8" rx="1" fill={c} opacity="0.6" />
      <rect x="44" y="53" width="4" height="8" rx="1" fill={c} opacity="0.6" />
      <line x1="4" y1="61" x2="60" y2="61" stroke={c} strokeWidth="2" opacity="0.3" />
    </svg>
  )
}

// === Main ===
export default function NewQuote() {
  const [step, setStep] = useState(1)
  const [workType, setWorkType] = useState('')
  const [client, setClient] = useState({ name: '', phone: '', city: '' })
  const [showNewClient, setShowNewClient] = useState(false)
  const [dims, setDims] = useState({
    width: '', length: '', height: '3', postSize: '15x15', attachType: 'wall',
    roofType: 'none', access: 'easy', helperType: 'regular', travelCost: '250',
    supplierDiscount: '', woodType: 'pine', direction: 'horizontal', baseType: 'concrete',
    stairs: '', supportBeam: false,
  })
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const profile = getProfile()
  const branding = getBranding()
  const setDim = (key, val) => setDims(prev => ({ ...prev, [key]: val }))
  const hasInput = parseFloat(dims.width) > 0 && parseFloat(dims.length) > 0
  const fmt = (n) => n?.toLocaleString('he-IL') || '0'

  const result = useMemo(() => {
    if (!hasInput || !workType) return null
    const d = { ...dims, width: parseFloat(dims.width) || 0, length: parseFloat(dims.length) || 0,
      height: workType === 'pergola' ? (parseFloat(dims.height) || 3) : dims.height,
      travelCost: parseFloat(dims.travelCost) || 250, supplierDiscount: parseFloat(dims.supplierDiscount) || 0,
      stairs: parseInt(dims.stairs) || 0 }
    return workType === 'pergola' ? calculatePergola(d, [], [], profile) : calculateDeck(d, [], [], profile)
  }, [workType, dims, hasInput])

  const handleSave = () => {
    if (!result) return
    if (client.name && !client.id) { const s = saveClient({ ...client }); client.id = s.id; saveClientAndSync(client) }
    const q = { type: workType, client: { id: client.id, name: client.name, phone: client.phone },
      dimensions: dims, result, status: 'draft' }
    saveQuote(q); saveQuoteAndSync(q)
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  // Step titles
  const stepTitles = {
    1: { title: 'במה נתחיל היום?', sub: 'בחרו את סוג הפרויקט כדי להתחיל בחישוב' },
    2: { title: 'מעולה! עכשיו נבחר לקוח', sub: '' },
    3: { title: 'מידות ומפרט', sub: 'כמעט סיימנו — רק צריך מידות מדויקות כדי להשלים את הצעת המחיר.' },
  }

  return (
    <div className="space-y-5">
      <StepBar current={step} />
      <p className="text-center text-xs text-[#717971]">שלב {step} מתוך 3</p>

      {/* === שלב 1: סוג עבודה === */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[#1a1c1a]">{stepTitles[1].title}</h2>
            <p className="text-sm text-[#717971] mt-1">{stepTitles[1].sub}</p>
          </div>
          <div className="space-y-3">
            {[{ v: 'pergola', l: 'פרגולה', d: 'תכנון פרגולות עץ מכל הסוגים', Icon: PergolaIcon },
              { v: 'deck', l: 'דק', d: 'חישוב דקים, תשתיות וחיפויים', Icon: DeckIcon }].map(o => (
              <button key={o.v} onClick={() => { setWorkType(o.v); setStep(2) }}
                className={`w-full p-5 rounded-2xl border-2 flex items-center gap-5 transition-all
                  ${workType === o.v ? 'border-[#2d5a3d] bg-[#bceec8]/15' : 'border-[#e7e9e4] bg-white hover:border-[#c1c9c0]'}`}>
                <o.Icon active={workType === o.v} />
                <div className="text-right flex-1">
                  <div className="text-xl font-bold text-[#1a1c1a]">{o.l}</div>
                  <div className="text-xs text-[#717971] mt-1">{o.d}</div>
                </div>
                {workType === o.v && <div className="w-6 h-6 bg-[#2d5a3d] rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
              </button>
            ))}
          </div>
          <div className="bg-[#fdce6c]/20 rounded-2xl p-4 flex items-center gap-3 border border-[#fdce6c]/40">
            <Settings2 size={22} className="text-[#C45D3E] shrink-0" />
            <p className="text-sm text-[#7a5900] font-medium">המערכת מחשבת כמויות וחומרים אוטומטית לפי הנדסת עץ</p>
          </div>
        </div>
      )}

      {/* === שלב 2: לקוח === */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[#1a1c1a]">{stepTitles[2].title}</h2>
          </div>

          {/* חיפוש */}
          <div className="relative">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#717971]" />
            <input placeholder="חיפוש לפי שם או טלפון..."
              className="w-full h-12 pr-11 pl-4 border border-[#c1c9c0] rounded-2xl bg-white text-sm focus:border-[#2d5a3d] focus:border-2 outline-none" />
          </div>

          {/* לקוחות קיימים */}
          {getClients().length > 0 && (
            <div>
              <p className="text-sm text-[#414942] font-medium mb-2 text-right">לקוחות קיימים</p>
              <div className="space-y-2">
                {getClients().slice(0, 5).map(c => (
                  <button key={c.id} onClick={() => { setClient(c); setStep(3) }}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all
                      ${client.id === c.id ? 'border-[#2d5a3d] bg-[#bceec8]/10' : 'border-[#e7e9e4] bg-white'}`}>
                    <div className="w-8 h-8 bg-[#e7e9e4] rounded-full flex items-center justify-center">
                      {client.id === c.id ? <Check size={16} className="text-[#2d5a3d]" /> : <Users size={16} className="text-[#717971]" />}
                    </div>
                    <div className="text-right flex-1 mr-3">
                      <div className="font-bold text-[#1a1c1a]">{c.name}</div>
                      {c.city && <div className="text-xs text-[#717971]">{c.city}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* לקוח חדש */}
          {showNewClient ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#c1c9c0] p-5 space-y-3">
              <h3 className="text-base font-bold text-center">הוספה מהירה</h3>
              <input value={client.name} onChange={e => setClient({ ...client, name: e.target.value })}
                placeholder="שם מלא" className="w-full h-12 px-4 border border-[#c1c9c0] rounded-xl text-sm focus:border-[#2d5a3d] outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={client.phone || ''} onChange={e => setClient({ ...client, phone: e.target.value })}
                  placeholder="טלפון" className="h-12 px-4 border border-[#c1c9c0] rounded-xl text-sm focus:border-[#2d5a3d] outline-none" />
                <input value={client.city || ''} onChange={e => setClient({ ...client, city: e.target.value })}
                  placeholder="עיר" className="h-12 px-4 border border-[#c1c9c0] rounded-xl text-sm focus:border-[#2d5a3d] outline-none" />
              </div>
              <button onClick={() => { if (client.name) setStep(3) }}
                className="w-full py-3 bg-[#C45D3E] text-white font-bold rounded-xl shadow-md">שמור לקוח</button>
            </div>
          ) : (
            <button onClick={() => setShowNewClient(true)}
              className="w-full py-3.5 bg-[#fdce6c] text-[#7a5900] font-bold rounded-2xl flex items-center justify-center gap-2">
              <UserPlus size={18} /> לקוח חדש
            </button>
          )}

          <button onClick={() => { setClient({ name: '', phone: '', city: '' }); setStep(3) }}
            className="w-full py-3 border border-[#c1c9c0] text-[#717971] rounded-2xl text-sm flex items-center justify-center gap-2">
            ללא לקוח
          </button>
        </div>
      )}

      {/* === שלב 3: מפרט === */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-[#1a1c1a]">{stepTitles[3].title}</h2>
            <p className="text-sm text-[#717971] mt-1">{stepTitles[3].sub}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e7e9e4] p-5 space-y-4">
            {/* מידות */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#414942] mb-1 font-medium">אורך (מטר)</label>
                <input type="number" value={dims.length} onChange={e => setDim('length', e.target.value)}
                  placeholder="0.0" step="0.1" className="w-full h-14 px-4 border border-[#c1c9c0] rounded-xl text-xl text-center font-bold focus:border-[#2d5a3d] focus:border-2 outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#414942] mb-1 font-medium">רוחב (מטר)</label>
                <input type="number" value={dims.width} onChange={e => setDim('width', e.target.value)}
                  placeholder="0.0" step="0.1" className="w-full h-14 px-4 border border-[#c1c9c0] rounded-xl text-xl text-center font-bold focus:border-[#2d5a3d] focus:border-2 outline-none" />
              </div>
            </div>

            {workType === 'pergola' && (
              <>
                {/* סוג התקנה */}
                <div>
                  <label className="block text-sm text-[#414942] mb-2 font-medium">סוג התקנה</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ v: 'wall', l: 'צמוד קיר' }, { v: 'free', l: 'עצמאי (4 רגליים)' }].map(o => (
                      <button key={o.v} onClick={() => setDim('attachType', o.v)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all
                          ${dims.attachType === o.v ? 'bg-[#2d5a3d] text-white' : 'bg-[#e7e9e4] text-[#414942]'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* גובה */}
                <div>
                  <label className="block text-sm text-[#414942] mb-2 font-medium">גובה הפרגולה (מטר)</label>
                  <div className="flex gap-2">
                    {['2.4', '2.7', '2.8', '3.0'].map(h => (
                      <button key={h} onClick={() => setDim('height', h)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
                          ${dims.height === h ? 'bg-[#2d5a3d] text-white' : 'bg-[#e7e9e4] text-[#414942]'}`}>
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="סוג עמוד" value={dims.postSize} onChange={v => setDim('postSize', v)}
                  options={[{ v: '15x15', l: '15x15 ס"מ' }, { v: '20x20', l: '20x20 ס"מ' }]} />

                <Field label="סוג קירוי" value={dims.roofType} onChange={v => setDim('roofType', v)}
                  options={[{ v: 'none', l: 'ללא' }, { v: 'santef', l: 'סנטף' }, { v: 'bh', l: 'BH - פוליקרבונט' }, { v: 'thermo', l: 'עץ טרמו' }]} />

                <Field label="רמת נגישות לאתר" value={dims.access} onChange={v => setDim('access', v)}
                  options={[{ v: 'easy', l: 'קלה' }, { v: 'medium', l: 'בינונית' }, { v: 'hard', l: 'קשה' }]}
                  help={dims.access === 'medium' ? 'בינונית: מרחק של עד 20 מטר מהרכב או קומה ראשונה ללא מעלית.' : dims.access === 'hard' ? 'קשה: גישה מוגבלת, צריך ציוד מיוחד.' : ''} />

                <Field label="סוג עוזר" value={dims.helperType} onChange={v => setDim('helperType', v)}
                  options={[{ v: 'regular', l: 'עוזר רגיל' }, { v: 'pro', l: 'מקצועי' }, { v: 'none', l: 'ללא' }]} />

                <NumInput label="עלות נסיעה" value={dims.travelCost} onChange={v => setDim('travelCost', v)} suffix="₪" />
                <NumInput label="הנחת ספק" value={dims.supplierDiscount} onChange={v => setDim('supplierDiscount', v)} suffix="%" />
              </>
            )}

            {workType === 'deck' && (
              <>
                <div>
                  <label className="block text-sm text-[#414942] mb-2 font-medium">סוג עץ</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(WOOD_TYPES).map(([key, wood]) => (
                      <button key={key} onClick={() => setDim('woodType', key)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all
                          ${dims.woodType === key ? 'bg-[#2d5a3d] text-white' : 'bg-[#e7e9e4] text-[#414942]'}`}>
                        {wood.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label="גובה מהקרקע" value={dims.height} onChange={v => setDim('height', v)}
                  options={[{ v: 'low', l: 'עד 30 ס"מ' }, { v: 'mid', l: '30-60 ס"מ' }, { v: 'high', l: 'מעל 60 ס"מ' }]}
                  help="גובה הדק מפני הקרקע — משפיע על סוג התשתית והמחיר." />

                <Field label="כיוון פריסה" value={dims.direction} onChange={v => setDim('direction', v)}
                  options={[{ v: 'horizontal', l: 'אופקי' }, { v: 'vertical', l: 'אנכי' }]} />

                <Field label="סוג בסיס" value={dims.baseType} onChange={v => setDim('baseType', v)}
                  options={[{ v: 'concrete', l: 'בטון' }, { v: 'akerstein', l: 'אקרשטיין' }, { v: 'none', l: 'ללא' }]} />

                <Field label="גישה" value={dims.access} onChange={v => setDim('access', v)}
                  options={[{ v: 'easy', l: 'קלה' }, { v: 'medium', l: 'בינונית' }, { v: 'hard', l: 'קשה' }]} />

                <Field label="עוזר" value={dims.helperType} onChange={v => setDim('helperType', v)}
                  options={[{ v: 'regular', l: 'רגיל' }, { v: 'pro', l: 'מקצועי' }, { v: 'none', l: 'ללא' }]} />

                <NumInput label="מדרגות" value={dims.stairs} onChange={v => setDim('stairs', v)} suffix="יח'" />
                <NumInput label="נסיעה" value={dims.travelCost} onChange={v => setDim('travelCost', v)} suffix="₪" />
                <NumInput label="הנחת ספק" value={dims.supplierDiscount} onChange={v => setDim('supplierDiscount', v)} suffix="%" />

                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input type="checkbox" checked={dims.supportBeam || false} onChange={e => setDim('supportBeam', e.target.checked)}
                    className="w-5 h-5 rounded border-[#c1c9c0] text-[#2d5a3d]" />
                  <span className="text-sm text-[#414942] font-medium">תומך תשתית</span>
                </label>
              </>
            )}
          </div>

          {/* שרטוט */}
          {result && workType === 'pergola' && (
            <PergolaSketch width={parseFloat(dims.width)} length={parseFloat(dims.length)} height={parseFloat(dims.height) || 3}
              postCount={result.engineering?.postCount} attachType={dims.attachType} roofType={dims.roofType}
              baseBeamSection={result.engineering?.baseBeamSection} supportSection={result.engineering?.supportSection} />
          )}
          {result && workType === 'deck' && (
            <DeckSketch width={parseFloat(dims.width)} length={parseFloat(dims.length)}
              direction={dims.direction} woodType={dims.woodType} height={dims.height} stairs={parseInt(dims.stairs) || 0} />
          )}

          {/* תוצאות */}
          {result && (
            <>
              <div className="bg-white rounded-2xl border border-[#e7e9e4] p-5">
                {/* מחיר ראשי */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-left">
                    <div className="text-xs text-[#717971]">מחיר למ"ר</div>
                    <div className="text-lg font-bold text-[#414942]">{fmt(result.totals.pricePerSqm)}₪</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#717971]">סה"כ לתשלום</div>
                    <div className="text-4xl font-extrabold text-[#C45D3E]">{fmt(result.totals.total)}₪</div>
                  </div>
                </div>

                {/* חומרים — מתקפל */}
                <button onClick={() => setExpandedSections(p => ({ ...p, mat: !p.mat }))}
                  className="w-full flex items-center justify-between py-3 border-t border-[#edeeea]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1a1c1a]">{fmt(result.totals.materials)}₪</span>
                    {expandedSections.mat ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  <span className="text-sm text-[#414942]">חומרים</span>
                </button>
                {expandedSections.mat && (
                  <div className="space-y-1.5 pr-3 pb-3">
                    {result.lineItems.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[#1a1c1a]">{fmt(item.cost)}₪</span>
                        <span className="text-[#717971]">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* עבודה + שינוע */}
                <div className="flex justify-between py-3 border-t border-[#edeeea] text-sm">
                  <span className="font-bold">{fmt(result.totals.labor + (result.travel || 0) + (result.accessCost || 0) + (result.heightCost || 0))}₪</span>
                  <span className="text-[#414942]">עבודה + שינוע</span>
                </div>

                {/* סיכום */}
                <div className="bg-[#bceec8]/20 rounded-xl p-4 mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>לפני מע"מ: {fmt(result.totals.beforeVat)}₪</span>
                    <span>כולל מע"מ (18%)</span>
                  </div>
                </div>
              </div>

              {/* כפתורים */}
              <button onClick={handleSave}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${saved ? 'bg-[#3ba55c] text-white' : 'bg-[#C45D3E] text-white shadow-[#C45D3E]/20 hover:brightness-110 active:scale-[0.98]'}`}>
                {saved ? <><Check size={20} /> ההצעה נשמרה!</> : <><Save size={20} /> שמור הצעה</>}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowPreview(true)}
                  className="py-3.5 rounded-2xl bg-[#fdce6c] text-[#7a5900] font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-105">
                  <FileText size={18} /> הצעת מחיר
                </button>
                <button onClick={() => result && generateMaterialsPDF(result, profile)}
                  className="py-3.5 rounded-2xl border-2 border-[#E8E4DB] text-[#414942] font-bold flex items-center justify-center gap-2 hover:bg-[#f3f4ef]">
                  <ClipboardList size={18} /> כתב כמויות
                </button>
              </div>
            </>
          )}

          {/* חזרה */}
          <button onClick={() => setStep(2)} className="w-full text-center text-sm text-[#717971] py-2">← חזרה לשלב הקודם</button>
        </div>
      )}

      {/* תצוגה מקדימה */}
      {showPreview && result && (
        <QuotePreview result={result} client={client} profile={profile} branding={branding} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}

// === קומפוננטות שדות ===
function Field({ label, value, onChange, options, help }) {
  return (
    <div>
      <label className="block text-sm text-[#414942] mb-2 font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o.v} onClick={() => onChange(o.v)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${value === o.v ? 'bg-[#2d5a3d] text-white' : 'bg-[#e7e9e4] text-[#414942] hover:bg-[#d9dad6]'}`}>
            {o.l}
          </button>
        ))}
      </div>
      {help && <p className="text-xs text-[#717971] mt-1.5 flex items-start gap-1"><span className="text-[#7a5900]">i</span> {help}</p>}
    </div>
  )
}

function NumInput({ label, value, onChange, suffix }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <input type="number" value={value || ''} onChange={e => onChange(e.target.value)}
          className="w-20 h-10 px-3 border border-[#c1c9c0] rounded-xl text-sm text-center font-bold focus:border-[#2d5a3d] outline-none" />
        <span className="text-xs text-[#717971]">{suffix}</span>
      </div>
      <label className="text-sm text-[#414942] font-medium">{label}</label>
    </div>
  )
}

// missing import used in step 2
function Users(props) {
  return <svg viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
}
