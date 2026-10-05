/**
 * שרטוט פרגולה — מבט מלמעלה. כל המיקומים מגיעים מהמנוע (engineering.layout),
 * כך שהשרטוט מציג בדיוק את אותם עמודים, תומכים וקורות כמו בכתב הכמויות.
 * ציר אופקי = W (רוחב, לאורך הקיר), ציר אנכי = L (אורך, הבולט מהקיר). בצמוד קיר — הקיר למעלה.
 */
const COLORS = { support: '#5C3317', base: '#A0522D', roof: '#C4A35A', post: '#1a1c1a', wall: '#9a9a9a' }

export default function PergolaSketch({ engineering, height, roofType }) {
  const lay = engineering?.layout
  if (!lay || !lay.L || !lay.W) return null
  const { L, W } = lay

  // קנה מידה — שומר על פרופורציות
  const maxW = 330, maxH = 230
  const s = Math.min(maxW / W, maxH / L)
  const dw = W * s, dh = L * s
  const padX = 55, padTop = 50, padBottom = 30
  const svgW = dw + padX * 2
  const svgH = dh + padTop + padBottom
  const X = (x) => padX + x * s
  const Y = (y) => padTop + y * s

  const hasRoof = roofType && roofType !== 'none'
  const roofNames = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
  const postSize = 9

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-bold text-[#1a1c19] mb-3 text-right">שרטוט — מבט מלמעלה</h3>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 420 }}>
        <rect x="0" y="0" width={svgW} height={svgH} fill="#fafaf5" rx="10" />

        {/* קיר */}
        {lay.attachType === 'wall' && (
          <>
            <rect x={X(0) - 8} y={Y(0) - 12} width={dw + 16} height={8} fill={COLORS.wall} opacity="0.35" />
            <text x={X(W / 2)} y={Y(0) - 18} textAnchor="middle" fontSize="10" fill="#777">קיר הבניין</text>
          </>
        )}

        {/* קירוי */}
        {hasRoof && <rect x={X(0)} y={Y(0)} width={dw} height={dh} fill="rgba(31,56,100,0.07)" />}

        {/* תומכי תשתית — לאורך הרוחב, אחד בכל שורת עמודים */}
        {lay.supports.map((y, i) => (
          <line key={`s${i}`} data-part="support" x1={X(0)} y1={Y(y)} x2={X(W)} y2={Y(y)}
            stroke={COLORS.support} strokeWidth="6" strokeLinecap="round" />
        ))}

        {/* קורות תשתית — מהקיר החוצה, מעל התומכים */}
        {lay.baseBeams.map((x, i) => (
          <line key={`b${i}`} data-part="base" x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(L)}
            stroke={COLORS.base} strokeWidth="3.5" />
        ))}

        {/* קורות גג — לאורך הרוחב, העליונות */}
        {lay.roofBeams.map((y, i) => (
          <line key={`r${i}`} data-part="roof" x1={X(0)} y1={Y(y)} x2={X(W)} y2={Y(y)}
            stroke={COLORS.roof} strokeWidth="1.8" opacity="0.9" />
        ))}

        {/* עמודים */}
        {lay.posts.map(([x, y], i) => (
          <rect key={`p${i}`} data-part="post" x={X(x) - postSize / 2} y={Y(y) - postSize / 2}
            width={postSize} height={postSize} fill={COLORS.post} rx="1.5" />
        ))}

        {/* מידות */}
        <line x1={X(0)} y1={Y(L) + 16} x2={X(W)} y2={Y(L) + 16} stroke="#1F3864" strokeWidth="1.2" />
        <text x={X(W / 2)} y={Y(L) + 28} textAnchor="middle" fontSize="13" fill="#1F3864" fontWeight="bold">רוחב {fmt(W)} מ'</text>
        <line x1={X(W) + 16} y1={Y(0)} x2={X(W) + 16} y2={Y(L)} stroke="#1F3864" strokeWidth="1.2" />
        {/* הדף מימין לשמאל — ולכן end = הטקסט נמתח ימינה מהנקודה, ולא עולה על קו המידה */}
        <text x={X(W) + 22} y={Y(L / 2) + 4} textAnchor="end" fontSize="13" fill="#1F3864" fontWeight="bold">{fmt(L)} מ'</text>
        <text x={X(W) + 22} y={Y(L / 2) + 18} textAnchor="end" fontSize="10" fill="#1F3864">אורך</text>
      </svg>

      {/* מקרא — טקסט רגיל, לא בתוך השרטוט, כדי שלא ייחתך */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#414942]" dir="rtl" data-sketch-legend>
        <Legend color={COLORS.post} square label={`${engineering.postCount} עמודים, גובה ${fmt(height)} מ'`} />
        <Legend color={COLORS.support} thick label={`${engineering.supportCount} תומכי תשתית ${engineering.supportSection || ''}`} />
        <Legend color={COLORS.base} label={`${engineering.baseBeamCount} קורות תשתית ${engineering.baseBeamSection || ''}`} />
        <Legend color={COLORS.roof} label={`${engineering.roofBeamCount} קורות גג ${engineering.roofBeamSection || ''}`} />
      </div>
      <p className="mt-2 text-xs text-[#717971] text-right">
        {lay.attachType === 'wall' ? 'צמודת קיר' : 'עצמאית'} | {fmt(L * W)} מ"ר{hasRoof ? ` | קירוי: ${roofNames[roofType]}` : ''}
      </p>
    </div>
  )
}

function Legend({ color, label, square, thick }) {
  return (
    <div className="flex items-center gap-2">
      {square
        ? <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
        : <span className="inline-block w-5 shrink-0 rounded" style={{ background: color, height: thick ? 5 : 3 }} />}
      <span>{label}</span>
    </div>
  )
}

function fmt(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString('he-IL', { maximumFractionDigits: 2 })
}
