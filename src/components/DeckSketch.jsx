/**
 * שרטוט דק — מבט מלמעלה + חתך צד, גדול וברור
 */
export default function DeckSketch({ width, length, direction, woodType, height, stairs, joistCount, boardRows, boardPieces, joistPieces, boardsBought, boardsCutFrom }) {
  if (!width || !length) return null

  // === פרופורציות נכונות ===
  const ratio = width / length
  const maxW = 340
  const maxH = 200

  let dw, dl
  if (ratio > maxW / maxH) {
    dw = maxW
    dl = maxW / ratio
  } else {
    dl = maxH
    dw = maxH * ratio
  }
  // מינימום 80px
  dw = Math.max(dw, 80)
  dl = Math.max(dl, 80)

  const padX = 50
  const padTop = 65
  const ox = (maxW + padX * 2 - dw) / 2
  const oy = padTop

  const stairCount = stairs || 0
  const stairZone = stairCount > 0 ? stairCount * 12 + 20 : 0
  const sideH = 100
  const totalH = padTop + dl + 30 + sideH + 12 + stairZone

  const svgW = maxW + padX * 2
  const svgH = totalH

  // קרשים — כל שורה מצוירת כחתיכות לפי תוכנית החיתוך של המנוע (אותו מספר כמו בטבלה)
  const isHoriz = direction === 'horizontal'
  const rows = Math.min(boardRows || 0, 150)
  const pieces = boardPieces?.length ? boardPieces : [isHoriz ? width : length]
  const runTotal = pieces.reduce((s, p) => s + p, 0) || 1
  const boardRects = []
  for (let r = 0; r < rows; r++) {
    let pos = 0
    for (const p of pieces) {
      const a = pos / runTotal, b = (pos + p) / runTotal
      if (isHoriz) {
        // קרשים לרוחב — כל שורה רצה לאורך ציר x
        boardRects.push({ x: ox + dw * a, y: oy + dl * r / rows, w: dw * (b - a), h: dl / rows })
      } else {
        boardRects.push({ x: ox + dw * r / rows, y: oy + dl * a, w: dw / rows, h: dl * (b - a) })
      }
      pos += p
    }
  }

  // קורות תשתית — המספר מגיע רק מהמנוע (אותו מספר כמו בכתב הכמויות)
  const jCount = joistCount || 0
  const joistLines = []
  for (let i = 0; i < Math.min(jCount, 80); i++) {
    const t = jCount > 1 ? i / (jCount - 1) : 0.5
    if (isHoriz) {
      joistLines.push({ x1: ox + dw * t, y1: oy - 5, x2: ox + dw * t, y2: oy + dl + 5 })
    } else {
      joistLines.push({ x1: ox - 5, y1: oy + dl * t, x2: ox + dw + 5, y2: oy + dl * t })
    }
  }

  // נקודות חיבור בקורות התשתית (כשהקורה ארוכה מהמלאי)
  const jointMarks = []
  if (joistPieces?.length > 1) {
    const jTotal = joistPieces.reduce((s, p) => s + p, 0)
    let acc = 0
    for (const p of joistPieces.slice(0, -1)) {
      acc += p
      const t = acc / jTotal
      joistLines.forEach(j => jointMarks.push(isHoriz
        ? { x: j.x1, y: oy + dl * t }
        : { x: ox + dw * t, y: j.y1 }))
    }
  }

  // חתך צד
  const sideY = oy + dl + 40 + stairZone
  const groundLevel = sideY + sideH - 10
  const deckLevel = height === 'low' ? groundLevel - 20 : height === 'mid' ? groundLevel - 45 : groundLevel - 75
  const heightLabels = { low: 'עד 30 ס"מ', mid: '30-60 ס"מ', high: 'מעל 60 ס"מ' }
  const woodNames = { pine: 'אורן', bamboo_d: 'במבוק כהה', bamboo_l: 'במבוק בהיר', ipe: 'איפאה', ipe_prem: 'איפאה פרמיום', cumaru: 'קומרו', sucupira: 'סוקופירה' }

  // רגליות בחתך
  const legCount = 4
  const legPositions = Array.from({ length: legCount }, (_, i) => ox + (dw / (legCount + 1)) * (i + 1))

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minHeight: 300 }}>
        <rect x="0" y="0" width={svgW} height={svgH} fill="#fafaf5" rx="10" />

        {/* === מבט מלמעלה === */}
        <text x={svgW / 2} y={18} textAnchor="middle" fontSize="13" fill="#1F3864" fontWeight="bold">מבט מלמעלה</text>

        {/* קורות תשתית (מתחת — מקווקו) */}
        {joistLines.map((j, i) => (
          <line key={`j${i}`} x1={j.x1} y1={j.y1} x2={j.x2} y2={j.y2}
            stroke="#A0522D" strokeWidth="3.5" opacity="0.2" strokeLinecap="round" />
        ))}

        {/* שטח הדק */}
        <rect x={ox} y={oy} width={dw} height={dl}
          fill="rgba(196,163,90,0.12)" stroke="#5C3317" strokeWidth="2.5" rx="3" />

        {/* קרשים — מלבן לכל לוח */}
        {boardRects.map((b, i) => (
          <rect key={`b${i}`} data-board="1" x={b.x} y={b.y} width={b.w} height={b.h}
            fill="none" stroke="#A0522D" strokeWidth="0.8" opacity="0.45" />
        ))}

        {/* חיבורים על קורות התשתית */}
        {jointMarks.map((m, i) => (
          <circle key={`jm${i}`} cx={m.x} cy={m.y} r="2.5" fill="#C45D3E" />
        ))}

        {/* כיוון חץ */}
        <text x={ox + dw / 2} y={oy + dl / 2 + 5} textAnchor="middle" fontSize="12" fill="#5C3317" fontWeight="bold" opacity="0.7">
          {isHoriz ? 'קרשים לרוחב' : 'קרשים לאורך'}
        </text>

        {/* מידה — רוחב (למעלה) */}
        <line x1={ox} y1={oy - 16} x2={ox + dw} y2={oy - 16} stroke="#1F3864" strokeWidth="1.5" />
        <line x1={ox} y1={oy - 22} x2={ox} y2={oy - 10} stroke="#1F3864" strokeWidth="1" />
        <line x1={ox + dw} y1={oy - 22} x2={ox + dw} y2={oy - 10} stroke="#1F3864" strokeWidth="1" />
        <text x={ox + dw / 2} y={oy - 26} textAnchor="middle" fontSize="15" fill="#1F3864" fontWeight="bold">{width} מ'</text>

        {/* מידה — אורך (בצד ימין) */}
        <line x1={ox + dw + 14} y1={oy} x2={ox + dw + 14} y2={oy + dl} stroke="#1F3864" strokeWidth="1.5" />
        <line x1={ox + dw + 8} y1={oy} x2={ox + dw + 20} y2={oy} stroke="#1F3864" strokeWidth="1" />
        <line x1={ox + dw + 8} y1={oy + dl} x2={ox + dw + 20} y2={oy + dl} stroke="#1F3864" strokeWidth="1" />
        <text x={ox + dw + 28} y={oy + dl / 2 + 5} textAnchor="end" fontSize="14" fill="#1F3864" fontWeight="bold">{length} מ'</text>

        {/* מדרגות — מחוברות לדק */}
        {stairCount > 0 && (
          <>
            {Array.from({ length: Math.min(stairCount, 5) }).map((_, i) => {
              const sw = dw * 0.5
              const sx = ox + (dw - sw) / 2
              const sy = oy + dl + 4 + i * 12
              return (
                <rect key={`s${i}`} x={sx} y={sy} width={sw} height={10}
                  fill={`rgba(160,82,45,${0.15 - i * 0.02})`} stroke="#5C3317" strokeWidth="1" rx="2" />
              )
            })}
            <text x={ox + dw / 2} y={oy + dl + 4 + Math.min(stairCount, 5) * 12 + 14}
              textAnchor="middle" fontSize="11" fill="#5C3317">{stairCount} מדרגות</text>
          </>
        )}

        {/* === חתך צד === */}
        <text x={svgW / 2} y={sideY - 14} textAnchor="middle" fontSize="13" fill="#1F3864" fontWeight="bold">חתך צד</text>

        {/* קרקע */}
        <line x1={ox - 30} y1={groundLevel} x2={ox + dw + 30} y2={groundLevel}
          stroke="#8B7355" strokeWidth="2.5" />
        {/* אדמה — מילוי */}
        <rect x={ox - 30} y={groundLevel} width={dw + 60} height={12} fill="#D2B48C" opacity="0.15" />
        <text x={ox + dw + 34} y={groundLevel + 4} fontSize="10" fill="#8B7355">קרקע</text>

        {/* רגליות */}
        {legPositions.map((lx, i) => (
          <g key={`leg${i}`}>
            <rect x={lx - 5} y={deckLevel + 6} width={10} height={groundLevel - deckLevel - 6}
              fill="#888" opacity="0.25" stroke="#666" strokeWidth="0.5" rx="1" />
            {/* בסיס בטון */}
            <rect x={lx - 8} y={groundLevel - 6} width={16} height={6}
              fill="#999" opacity="0.3" rx="1" />
          </g>
        ))}

        {/* קורות תשתית בחתך */}
        {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((t, i) => (
          <rect key={`sj${i}`} x={ox + dw * t - 3} y={deckLevel + 2}
            width={6} height={8} fill="#A0522D" opacity="0.45" stroke="#5C3317" strokeWidth="0.5" rx="1" />
        ))}

        {/* משטח דק */}
        <rect x={ox - 4} y={deckLevel - 3} width={dw + 8} height={6}
          fill="#C4A35A" stroke="#5C3317" strokeWidth="1.5" rx="2" />

        {/* חץ גובה */}
        <line x1={ox - 20} y1={deckLevel} x2={ox - 20} y2={groundLevel} stroke="#c00" strokeWidth="1.5" />
        <line x1={ox - 26} y1={deckLevel} x2={ox - 14} y2={deckLevel} stroke="#c00" strokeWidth="1" />
        <line x1={ox - 26} y1={groundLevel} x2={ox - 14} y2={groundLevel} stroke="#c00" strokeWidth="1" />
        <text x={ox - 24} y={(deckLevel + groundLevel) / 2 + 4} textAnchor="end" fontSize="10" fill="#c00" fontWeight="bold">
          {heightLabels[height] || ''}
        </text>

      </svg>
      {/* מקרא — טקסט רגיל מתחת לשרטוט, כדי שלא ייחתך */}
      <div className="mt-3 text-xs text-[#414942] text-center leading-relaxed" data-sketch-legend>
        {woodNames[woodType] || 'אורן'} | {rows} שורות{pieces.length > 1 ? ` (כל שורה ${pieces.map(p => Math.round(p * 100) / 100).join(' + ')} מ')` : ''} | {jCount} קורות תשתית | {Math.round(width * length * 100) / 100} מ"ר
        {stairCount > 0 ? ` | ${stairCount} מדרגות` : ''}
        {boardsBought > 0 && <span className="block">קונים {boardsBought} לוחות (שטח + 15%). כל החתיכות בשרטוט נחתכות מתוך {boardsCutFrom} לוחות לפי תוכנית החיתוך</span>}
        {jointMarks.length > 0 && <span className="block text-[#C45D3E]">נקודה כתומה = חיבור קורת תשתית על רגל</span>}
      </div>
    </div>
  )
}
