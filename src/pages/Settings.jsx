import { useState, useEffect } from 'react'
import { getProfile, saveProfile, getBranding, saveBranding, getMaterials, saveMaterials } from '../utils/storage'
import { Save, Plus, Trash2, ToggleLeft, ToggleRight, Check } from 'lucide-react'

export default function Settings() {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(() => getProfile())
  const [branding, setBranding] = useState(() => getBranding())
  const [materials, setMaterials] = useState(() => getMaterials())
  const [savedMsg, setSavedMsg] = useState('')

  // טעינה מחדש כשהדף נפתח
  useEffect(() => {
    setProfile(getProfile())
    setBranding(getBranding())
    setMaterials(getMaterials())
  }, [])

  const showSaved = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSaveProfile = () => {
    saveProfile(profile)
    showSaved('הפרופיל נשמר בהצלחה')
  }

  const handleSaveBranding = () => {
    saveBranding(branding)
    showSaved('המיתוג נשמר בהצלחה')
  }

  const handleSaveMaterials = () => {
    saveMaterials(materials)
    showSaved('המחירון נשמר בהצלחה')
  }

  const updateProfile = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const updateBranding = (key, value) => {
    setBranding(prev => ({ ...prev, [key]: value }))
  }

  const updateMaterial = (id, key, value) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m))
  }

  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id), 0) + 1
    setMaterials(prev => [...prev, {
      id: newId, category: 'אחר', name: 'חומר חדש', width: 0, height: 0,
      piece_length: 0, unit: "יח'", price_per_unit: 0, supplier: '', is_active: true,
    }])
  }

  const deleteMaterial = (id) => {
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateBranding('logo_url', ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const tabs = [
    { key: 'profile', label: 'פרופיל ולוגו' },
    { key: 'branding', label: 'הצעת מחיר' },
    { key: 'materials', label: 'מחירון' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1a1c1a]">הגדרות</h2>

      {/* הודעת שמירה */}
      {savedMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-center font-medium flex items-center justify-center gap-2">
          <Check size={18} />
          {savedMsg}
        </div>
      )}

      {/* טאבים */}
      <div className="flex gap-1 bg-[#edeeea] rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition
              ${tab === t.key
                ? 'bg-white text-[#2d5a3d] shadow-sm'
                : 'text-[#414942] hover:text-[#1a1c1a]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === פרופיל + לוגו === */}
      {tab === 'profile' && (
        <div className="space-y-5">
          {/* לוגו */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">לוגו העסק</h3>
            <div className="border-2 border-dashed border-[#c1c9c0] rounded-xl p-6 text-center">
              {branding.logo_url ? (
                <div className="space-y-3">
                  <img src={branding.logo_url} alt="לוגו" className="max-h-24 mx-auto rounded" />
                  <button
                    onClick={() => { updateBranding('logo_url', ''); saveBranding({ ...branding, logo_url: '' }) }}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    הסר לוגו
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-[#edeeea] rounded-xl mx-auto flex items-center justify-center text-2xl">
                    🪵
                  </div>
                  <p className="text-sm text-[#414942]">העלה לוגו של העסק</p>
                  <p className="text-xs text-[#717971]">יופיע בהצעות המחיר ובכתבי הכמויות</p>
                  <label className="inline-block px-5 py-2.5 bg-[#2d5a3d] text-white rounded-lg text-sm font-bold cursor-pointer hover:brightness-110 transition">
                    בחר תמונה
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* פרטי עסק */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">פרטי העסק</h3>
            <Field label="שם העסק" value={profile.business_name} onChange={v => updateProfile('business_name', v)} placeholder="למשל: אורי גזית - עבודות עץ" />
            <Field label="שם בעל העסק" value={profile.owner_name} onChange={v => updateProfile('owner_name', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="טלפון" value={profile.phone} onChange={v => updateProfile('phone', v)} placeholder="050-0000000" />
              <Field label="אימייל" value={profile.email} onChange={v => updateProfile('email', v)} type="email" />
            </div>
            <Field label="כתובת" value={profile.address} onChange={v => updateProfile('address', v)} />
            <Field label="ח.פ. / מספר עוסק" value={profile.license_number} onChange={v => updateProfile('license_number', v)} />
          </div>

          {/* תעריפים */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">תעריפים</h3>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="תעריף שעתי" suffix="&#8362;" value={profile.hourly_rate} onChange={v => updateProfile('hourly_rate', v)} />
              <NumField label="עוזר - יומי" suffix="&#8362;" value={profile.helper_daily} onChange={v => updateProfile('helper_daily', v)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="תקורה" suffix="%" value={profile.overhead_pct} onChange={v => updateProfile('overhead_pct', v)} />
              <NumField label="מרווח ביטחון" suffix="%" value={profile.safety_pct} onChange={v => updateProfile('safety_pct', v)} />
              <NumField label="אחוז רווח" suffix="%" value={profile.profit_pct} onChange={v => updateProfile('profit_pct', v)} />
            </div>
            <NumField label="הנחת ספק ברירת מחדל" suffix="%" value={profile.supplier_discount} onChange={v => updateProfile('supplier_discount', v)} />
            <p className="text-xs text-[#717971] bg-[#f3f4ef] rounded-lg p-3">
              תקורה = רכב, כלים, ביטוח. מרווח ביטחון = כיסוי אי-ודאויות. חישוב: (עלויות + תקורה) x ביטחון x רווח.
            </p>
          </div>

          {/* ימי עבודה */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">ימי עבודה</h3>
            <p className="text-xs text-[#717971]">פרגולה ממוצעת (3×4 מ') — כמה ימים?</p>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="עם עוזר" suffix="ימים" value={profile.pergola_days_with_helper} onChange={v => updateProfile('pergola_days_with_helper', v)} />
              <NumField label="לבד" suffix="ימים" value={profile.pergola_days_alone} onChange={v => updateProfile('pergola_days_alone', v)} />
            </div>
            <p className="text-xs text-[#717971]">דק ממוצע (20 מ"ר) — כמה ימים?</p>
            <div className="grid grid-cols-2 gap-4">
              <NumField label="עם עוזר" suffix="ימים" value={profile.deck_days_with_helper} onChange={v => updateProfile('deck_days_with_helper', v)} />
              <NumField label="לבד" suffix="ימים" value={profile.deck_days_alone} onChange={v => updateProfile('deck_days_alone', v)} />
            </div>
          </div>

          {/* כפתור שמירה קבוע */}
          <div className="sticky bottom-20 z-40">
            <button onClick={handleSaveProfile} className="w-full py-4 rounded-xl bg-[#C45D3E] text-white font-bold text-lg flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-[#C45D3E]/20">
              <Save size={20} />
              שמור פרופיל
            </button>
          </div>
        </div>
      )}

      {/* === מיתוג הצעת מחיר === */}
      {tab === 'branding' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">עיצוב הצעת מחיר</h3>

            <div>
              <label className="block text-sm text-[#414942] mb-1">צבע מותג</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.brand_color}
                  onChange={e => updateBranding('brand_color', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-[#c1c9c0] cursor-pointer"
                />
                <span className="text-sm text-[#414942]">{branding.brand_color}</span>
              </div>
            </div>

            <Field label="כותרת הצעה" value={branding.quote_title} onChange={v => updateBranding('quote_title', v)} placeholder="הצעת מחיר" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">תנאים וטקסטים</h3>
            <Field label="תנאי תשלום" value={branding.payment_terms} onChange={v => updateBranding('payment_terms', v)} multiline placeholder="40% מקדמה, 60% בסיום" />
            <Field label="אחריות" value={branding.warranty_text} onChange={v => updateBranding('warranty_text', v)} multiline placeholder="אחריות 5 שנים על עבודה" />
            <Field label="תוקף הצעה" value={branding.validity_text} onChange={v => updateBranding('validity_text', v)} placeholder="ההצעה בתוקף ל-14 יום" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#1a1c1a]">מה כלול / לא כלול</h3>
            <ListEditor
              label="כלול בהצעה"
              items={branding.included_list || []}
              onChange={v => updateBranding('included_list', v)}
            />
            <ListEditor
              label="לא כלול בהצעה"
              items={branding.excluded_list || []}
              onChange={v => updateBranding('excluded_list', v)}
            />
          </div>

          <div className="sticky bottom-20 z-40">
            <button onClick={handleSaveBranding} className="w-full py-4 rounded-xl bg-[#C45D3E] text-white font-bold text-lg flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-[#C45D3E]/20">
              <Save size={20} />
              שמור הגדרות הצעה
            </button>
          </div>
        </div>
      )}

      {/* === מחירון חומרים === */}
      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#edeeea] flex items-center justify-between">
              <button onClick={addMaterial} className="flex items-center gap-1 text-sm bg-[#fdce6c] text-[#7a5900] px-4 py-2 rounded-xl font-bold hover:brightness-105 transition">
                <Plus size={16} />
                הוסף חומר
              </button>
              <h3 className="text-lg font-bold text-[#1a1c1a]">מחירון חומרים</h3>
            </div>

            <p className="px-4 py-2 text-xs text-[#717971] bg-[#f3f4ef]">
              המחירון משמש את המחשבונים. שנה מחירים, הוסף חומרים, או כבה פריטים לא רלוונטיים.
            </p>

            <div className="divide-y divide-[#edeeea]">
              {(() => {
                const categories = [...new Set(materials.map(m => m.category))]
                return categories.map(cat => (
                  <div key={cat}>
                    <div className="bg-[#144227] text-white px-4 py-2.5 text-sm font-bold text-right">{cat}</div>
                    {materials.filter(m => m.category === cat).map(mat => (
                      <MaterialRow key={mat.id} mat={mat} updateMaterial={updateMaterial} deleteMaterial={deleteMaterial} />
                    ))}
                  </div>
                ))
              })()}
            </div>
          </div>

          <div className="sticky bottom-20 z-40">
            <button onClick={handleSaveMaterials} className="w-full py-4 rounded-xl bg-[#C45D3E] text-white font-bold text-lg flex items-center justify-center gap-2 hover:brightness-110 transition shadow-lg shadow-[#C45D3E]/20">
              <Save size={20} />
              שמור מחירון
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// --- קומפוננטות עזר ---

function Field({ label, value, onChange, type = 'text', placeholder = '', multiline = false }) {
  const cls = "w-full px-4 border border-[#c1c9c0] rounded-lg bg-white focus:border-[#2d5a3d] focus:border-2 outline-none"
  return (
    <div>
      <label className="block text-sm text-[#414942] mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${cls} py-3 resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${cls} h-12`}
        />
      )}
    </div>
  )
}

function NumField({ label, suffix, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-[#414942] mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value || 0}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-12 px-4 pl-12 border border-[#c1c9c0] rounded-lg bg-white focus:border-[#2d5a3d] focus:border-2 outline-none"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#717971]" dangerouslySetInnerHTML={{ __html: suffix }} />
      </div>
    </div>
  )
}

function MaterialRow({ mat, updateMaterial, deleteMaterial }) {
  const hasDimensions = mat.piece_length !== undefined && mat.piece_length > 0
  // שם דינמי — אם יש מידות, מציג אותן
  const displayName = mat.width && mat.height && mat.width > 0 && mat.height > 0
    ? `${mat.name.replace(/\d+[xX×]\d+/g, '')} ${mat.width}x${mat.height}`.trim()
    : mat.name

  return (
    <div className={`p-4 space-y-3 border-b border-[#edeeea] ${!mat.is_active ? 'opacity-40 bg-gray-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => deleteMaterial(mat.id)} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
          <button onClick={() => updateMaterial(mat.id, 'is_active', !mat.is_active)}>
            {mat.is_active ? <ToggleRight size={22} className="text-[#2d5a3d]" /> : <ToggleLeft size={22} className="text-[#c1c9c0]" />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* מחיר — בולט */}
          <div className="bg-[#fdce6c] px-3 py-1 rounded-lg text-sm font-bold text-[#7a5900]">
            {mat.price_per_unit}₪
          </div>
          <div className="text-right">
            <div className="font-bold text-[#1a1c1a] text-base">{displayName}</div>
            {mat.supplier && <div className="text-[11px] text-[#717971]">ספק: {mat.supplier}</div>}
            {mat.unit && <span className="text-[10px] bg-[#e7e9e4] text-[#414942] px-2 py-0.5 rounded-full">{mat.unit}</span>}
          </div>
        </div>
      </div>

      {/* עריכה */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-[#717971]">מחיר</label>
          <input type="number" step="0.01" value={mat.price_per_unit} onChange={e => updateMaterial(mat.id, 'price_per_unit', Number(e.target.value))}
            className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm bg-[#fdce6c]/10 focus:border-[#2d5a3d] outline-none font-bold" />
        </div>
        <div>
          <label className="text-[10px] text-[#717971]">שם</label>
          <input value={mat.name} onChange={e => updateMaterial(mat.id, 'name', e.target.value)}
            className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm focus:border-[#2d5a3d] outline-none" />
        </div>
        <div>
          <label className="text-[10px] text-[#717971]">ספק</label>
          <input value={mat.supplier || ''} onChange={e => updateMaterial(mat.id, 'supplier', e.target.value)}
            className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm focus:border-[#2d5a3d] outline-none" placeholder="ספק" />
        </div>
      </div>

      {hasDimensions && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-[#717971]">אורך יחידה (מ')</label>
            <input type="number" step="0.1" value={mat.piece_length || ''} onChange={e => updateMaterial(mat.id, 'piece_length', Number(e.target.value))}
              className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm bg-[#fdce6c]/10 focus:border-[#2d5a3d] outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-[#717971]">רוחב (ס"מ)</label>
            <input type="number" step="0.1" value={mat.width || ''} onChange={e => updateMaterial(mat.id, 'width', Number(e.target.value))}
              className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm focus:border-[#2d5a3d] outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-[#717971]">גובה (ס"מ)</label>
            <input type="number" step="0.1" value={mat.height || ''} onChange={e => updateMaterial(mat.id, 'height', Number(e.target.value))}
              className="w-full h-9 px-2 border border-[#c1c9c0] rounded-lg text-sm focus:border-[#2d5a3d] outline-none" />
          </div>
        </div>
      )}
    </div>
  )
}

function ListEditor({ label, items, onChange }) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (!newItem.trim()) return
    onChange([...items, newItem.trim()])
    setNewItem('')
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      <label className="block text-sm text-[#414942] mb-2">{label}</label>
      <div className="space-y-1.5 mb-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[#f3f4ef] rounded-lg px-3 py-2">
            <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-xs">
              <Trash2 size={14} />
            </button>
            <span className="text-sm text-[#1a1c1a]">{item}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={addItem} className="px-3 py-2 bg-[#edeeea] rounded-lg text-sm font-medium hover:bg-[#ddddd8] transition">
          הוסף
        </button>
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="הוסף פריט..."
          className="flex-1 h-10 px-3 border border-[#c1c9c0] rounded-lg text-sm bg-white focus:border-[#2d5a3d] outline-none"
        />
      </div>
    </div>
  )
}
