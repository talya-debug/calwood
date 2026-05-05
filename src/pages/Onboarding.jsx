import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProfile, saveProfile, getMaterials, saveMaterials, setOnboardingDone } from '../utils/storage'
import { ChevronLeft, Building2, Wrench, Package, Rocket, HelpCircle } from 'lucide-react'

const STEPS = [
  { icon: '👋', title: 'ברוכים הבאים' },
  { icon: Building2, title: 'פרטי העסק' },
  { icon: Wrench, title: 'דרכי עבודה' },
  { icon: Package, title: 'המחירון שלך' },
  { icon: Rocket, title: 'מוכן!' },
]

function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all duration-300
          ${i === current ? 'w-8 bg-[#2d5a3d]' : i < current ? 'w-2 bg-[#9ed0ab]' : 'w-2 bg-[#e7e9e4]'}`} />
      ))}
    </div>
  )
}

function Tip({ text }) {
  return (
    <div className="flex items-start gap-2 bg-[#fdce6c]/15 rounded-xl p-3 mt-2">
      <HelpCircle size={16} className="text-[#C45D3E] shrink-0 mt-0.5" />
      <p className="text-xs text-[#7a5900] leading-relaxed">{text}</p>
    </div>
  )
}

function LabelInput({ label, value, onChange, placeholder, type = 'text', tip }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#414942] mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 border border-[#c1c9c0] rounded-xl text-base focus:border-[#2d5a3d] focus:border-2 outline-none" />
      {tip && <Tip text={tip} />}
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(getProfile)
  const [materials, setMaterials] = useState(getMaterials)
  const [supplierDiscount, setSupplierDiscount] = useState(profile.supplier_discount || 0)

  const updateProfile = (key, val) => setProfile(prev => ({ ...prev, [key]: val }))
  const updateMaterial = (id, key, val) => setMaterials(prev => prev.map(m => m.id === id ? { ...m, [key]: val } : m))

  const next = () => {
    if (step === 1 || step === 2) saveProfile(profile)
    if (step === 3) { saveMaterials(materials); saveProfile({ ...profile, supplier_discount: supplierDiscount }) }
    setStep(s => s + 1)
  }

  const finish = (goTo) => {
    setOnboardingDone()
    navigate(goTo)
  }

  // קטגוריות מחירון עיקריות להצגה
  const mainCategories = ['עמודים', 'קורות', 'לוחות דק']
  const mainMaterials = materials.filter(m => mainCategories.includes(m.category))

  return (
    <div className="min-h-screen bg-[#f9faf5] flex flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">

        {/* לוגו */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-extrabold text-[#2d5a3d]">CalWood</h1>
        </div>

        <ProgressDots current={step} total={5} />

        {/* === שלב 0: ברוך הבא === */}
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
            <div className="text-6xl">🪵</div>
            <h2 className="text-2xl font-extrabold text-[#1a1c1a]">ברוכים הבאים ל-CalWood!</h2>
            <p className="text-[#414942] leading-relaxed">
              CalWood יודע לחשב כמויות מדויקות של חומרים לפי מידות הפרויקט — ולייצר הצעת מחיר מקצועית תוך דקה.
            </p>
            <p className="text-sm text-[#717971]">בוא נגדיר את הפרופיל שלך — זה לוקח 2 דקות</p>
            <button onClick={next}
              className="w-full h-14 bg-[#C45D3E] text-white rounded-xl font-bold text-lg shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2">
              יאללה, בוא נתחיל <ChevronLeft size={20} />
            </button>
          </div>
        )}

        {/* === שלב 1: פרטי עסק === */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Building2 size={24} className="text-[#2d5a3d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a1c1a]">ספר לנו על העסק שלך</h2>
              <p className="text-sm text-[#717971] mt-1">הפרטים יופיעו בהצעות המחיר שלך</p>
            </div>

            <LabelInput label="שם העסק" value={profile.business_name} onChange={v => updateProfile('business_name', v)}
              placeholder="למשל: יוסי כהן — עבודות עץ" />
            <LabelInput label="שם בעל העסק" value={profile.owner_name} onChange={v => updateProfile('owner_name', v)}
              placeholder="השם שיופיע בחתימה" />
            <div className="grid grid-cols-2 gap-3">
              <LabelInput label="טלפון" value={profile.phone} onChange={v => updateProfile('phone', v)} placeholder="050-0000000" />
              <LabelInput label="אימייל" value={profile.email} onChange={v => updateProfile('email', v)} placeholder="you@email.com" />
            </div>

            <button onClick={next}
              className="w-full h-14 bg-[#2d5a3d] text-white rounded-xl font-bold text-lg shadow-md hover:brightness-110 transition flex items-center justify-center gap-2">
              הבא <ChevronLeft size={18} />
            </button>
            <button onClick={() => setStep(0)} className="w-full text-center text-sm text-[#717971] py-2">← חזרה</button>
          </div>
        )}

        {/* === שלב 2: תעריפים ודרכי עבודה === */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Wrench size={24} className="text-[#2d5a3d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a1c1a]">איך אתה עובד?</h2>
              <p className="text-sm text-[#717971] mt-1">נשתמש בנתונים האלה לחישוב עבודה ורווח בכל הצעה</p>
            </div>

            <LabelInput label="תעריף שעתי שלך (₪)" value={profile.hourly_rate} onChange={v => updateProfile('hourly_rate', v)}
              type="number" placeholder="250"
              tip="כמה אתה מחשב לשעת עבודה שלך? 250 ₪ זה ממוצע בשוק." />

            <LabelInput label="עלות עוזר ליום (₪)" value={profile.helper_daily} onChange={v => updateProfile('helper_daily', v)}
              type="number" placeholder="900"
              tip="כמה עולה לך עוזר ליום עבודה? עוזר רגיל ~900, מקצועי ~1,300." />

            <div className="grid grid-cols-3 gap-3">
              <LabelInput label="תקורה %" value={profile.overhead_pct} onChange={v => updateProfile('overhead_pct', v)}
                type="number" placeholder="5" />
              <LabelInput label="ביטחון %" value={profile.safety_pct} onChange={v => updateProfile('safety_pct', v)}
                type="number" placeholder="5" />
              <LabelInput label="רווח %" value={profile.profit_pct} onChange={v => updateProfile('profit_pct', v)}
                type="number" placeholder="20" />
            </div>
            <Tip text="תקורה = רכב, כלים, ביטוח (5% רגיל). ביטחון = כרית למקרה שמשהו עולה יותר. רווח = 20% ממוצע בשוק." />

            <button onClick={next}
              className="w-full h-14 bg-[#2d5a3d] text-white rounded-xl font-bold text-lg shadow-md hover:brightness-110 transition flex items-center justify-center gap-2">
              הבא <ChevronLeft size={18} />
            </button>
            <button onClick={() => setStep(1)} className="w-full text-center text-sm text-[#717971] py-2">← חזרה</button>
          </div>
        )}

        {/* === שלב 3: מחירון === */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#2d5a3d]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Package size={24} className="text-[#2d5a3d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a1c1a]">המחירון שלך</h2>
              <p className="text-sm text-[#717971] mt-1">
                כאן תכניס את המחירים והמידות של הספק שלך.
                <br />המערכת תחשב כמויות מדויקות לפי המידות שלו.
              </p>
            </div>

            <Tip text="כל ספק מוכר קורות ולוחות במידות ומחירים שונים. כשתכניס את הנתונים של הספק שלך — המערכת תגיד לך בדיוק כמה יחידות להזמין." />

            {/* הנחת ספק */}
            <LabelInput label="הנחת ספק כללית (%)" value={supplierDiscount} onChange={setSupplierDiscount}
              type="number" placeholder="0"
              tip="אם יש לך הנחה קבועה מהספק — הכנס אחוז. היא תחושב על כל מוצרי העץ." />

            {/* חומרים עיקריים */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mainCategories.map(cat => {
                const items = materials.filter(m => m.category === cat)
                if (items.length === 0) return null
                return (
                  <div key={cat}>
                    <div className="text-xs font-bold text-[#2d5a3d] mb-1 uppercase tracking-wider">{cat}</div>
                    {items.map(mat => (
                      <div key={mat.id} className="flex items-center justify-between bg-[#f3f4ef] rounded-lg p-2.5 mb-1.5">
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.01" value={mat.price_per_unit}
                            onChange={e => updateMaterial(mat.id, 'price_per_unit', Number(e.target.value))}
                            className="w-16 h-8 px-2 border border-[#c1c9c0] rounded-lg text-sm font-bold bg-[#fdce6c]/20 text-center focus:border-[#2d5a3d] outline-none" />
                          <span className="text-[10px] text-[#717971]">₪/מ'</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-[#1a1c1a]">{mat.name}</div>
                          {mat.piece_length > 0 && (
                            <div className="flex items-center gap-1 justify-end mt-0.5">
                              <input type="number" step="0.1" value={mat.piece_length}
                                onChange={e => updateMaterial(mat.id, 'piece_length', Number(e.target.value))}
                                className="w-12 h-6 px-1 border border-[#c1c9c0] rounded text-[10px] text-center focus:border-[#2d5a3d] outline-none" />
                              <span className="text-[10px] text-[#717971]">אורך יח' (מ')</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            <p className="text-[10px] text-[#717971] text-center">את שאר החומרים תוכל לעדכן בהגדרות → מחירון</p>

            <button onClick={next}
              className="w-full h-14 bg-[#2d5a3d] text-white rounded-xl font-bold text-lg shadow-md hover:brightness-110 transition flex items-center justify-center gap-2">
              סיימתי <ChevronLeft size={18} />
            </button>
            <button onClick={() => { setStep(4); saveProfile({ ...profile, supplier_discount: supplierDiscount }) }}
              className="w-full text-center text-sm text-[#717971] py-2">אדלג ואעדכן אח"כ →</button>
            <button onClick={() => setStep(2)} className="w-full text-center text-sm text-[#717971] py-1">← חזרה</button>
          </div>
        )}

        {/* === שלב 4: מוכן! === */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-extrabold text-[#1a1c1a]">הכל מוכן!</h2>
            <p className="text-[#414942] leading-relaxed">
              עכשיו אתה יכול ליצור הצעת מחיר ראשונה.
              <br />הזן מידות → המערכת מחשבת כמויות → תקבל הצעה מקצועית.
            </p>

            <button onClick={() => finish('/new-quote')}
              className="w-full h-14 bg-[#C45D3E] text-white rounded-xl font-bold text-lg shadow-lg hover:brightness-110 transition flex items-center justify-center gap-2">
              צור הצעה ראשונה <ChevronLeft size={20} />
            </button>
            <button onClick={() => finish('/')}
              className="w-full text-center text-sm text-[#717971] py-2">אני רוצה להסתכל קודם</button>
          </div>
        )}

      </div>
    </div>
  )
}
