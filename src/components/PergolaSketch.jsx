/**
 * שרטוט SVG של פרגולה — 3D אקסונומטרי + חתך צד
 */
export default function PergolaSketch({ width, length, height, postCount, attachType, roofType, baseBeamSection, supportSection }) {
  if (!width || !length) return null

  const svgW = 400
  const svgH = 380
  const pad = 35

  const scale = Math.min((svgW - pad * 2) / (width + length * 0.4), 180 / (height + length * 0.3))
  const w = width * scale
  const l = length * scale * 0.4
  const h = height * scale * 0.55

  const ox = svgW - pad - l
  const oy = 220

  // 4 פינות רצפה
  const flr = { fr: [ox, oy], fl: [ox - w, oy], br: [ox + l, oy - l], bl: [ox - w + l, oy - l] }
  // 4 פינות גג
  const top = {
    fr: [flr.fr[0], flr.fr[1] - h], fl: [flr.fl[0], flr.fl[1] - h],
    br: [flr.br[0], flr.br[1] - h], bl: [flr.bl[0], flr.bl[1] - h],
  }

  // עמודים
  const posts = []
  if (attachType === 'wall') {
    for (let i = 0; i < postCount; i++) {
      const t = postCount > 1 ? i / (postCount - 1) : 0
      const bx = flr.fl[0] + (flr.fr[0] - flr.fl[0]) * t
      posts.push({ b: [bx, flr.fl[1]], t: [bx, flr.fl[1] - h] })
    }
  } else {
    const front = Math.ceil(postCount / 2)
    const back = postCount - front
    for (let i = 0; i < front; i++) {
      const t = front > 1 ? i / (front - 1) : 0
      const bx = flr.fl[0] + (flr.fr[0] - flr.fl[0]) * t
      posts.push({ b: [bx, flr.fl[1]], t: [bx, flr.fl[1] - h] })
    }
    for (let i = 0; i < back; i++) {
      const t = back > 1 ? i / (back - 1) : 0
      const bx = flr.bl[0] + (flr.br[0] - flr.bl[0]) * t
      posts.push({ b: [bx, flr.bl[1]], t: [bx, flr.bl[1] - h] })
    }
  }

  // קורות גג
  const roofBeamCount = Math.min(Math.ceil(length / 0.6) + 1, 14)
  const roofBeams = []
  for (let i = 0; i < roofBeamCount; i++) {
    const t = roofBeamCount > 1 ? i / (roofBeamCount - 1) : 0
    roofBeams.push({
      l: [top.fl[0] + (top.bl[0] - top.fl[0]) * t, top.fl[1] + (top.bl[1] - top.fl[1]) * t],
      r: [top.fr[0] + (top.br[0] - top.fr[0]) * t, top.fr[1] + (top.br[1] - top.fr[1]) * t],
    })
  }

  const pt = (arr) => arr.join(',')
  const hasRoof = roofType && roofType !== 'none'
  const roofNames = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-bold text-[#1a1c19] mb-3 text-right">שרטוט סכמתי</h3>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
        <rect x="0" y="0" width={svgW} height={svgH} fill="#fafaf5" rx="10" />

        {/* קירוי */}
        {hasRoof && (
          <polygon points={`${pt(top.fl)} ${pt(top.fr)} ${pt(top.br)} ${pt(top.bl)}`}
            fill="rgba(31,56,100,0.06)" stroke="#1F3864" strokeWidth="0.5" strokeDasharray="5,4" />
        )}

        {/* קורות גג */}
        {roofBeams.map((beam, i) => (
          <line key={`rb${i}`} x1={beam.l[0]} y1={beam.l[1]} x2={beam.r[0]} y2={beam.r[1]}
            stroke="#C4A35A" strokeWidth="2.5" opacity="0.6" />
        ))}

        {/* קורות תשתית */}
        <line x1={top.fl[0]} y1={top.fl[1]} x2={top.fr[0]} y2={top.fr[1]} stroke="#5C3317" strokeWidth="4" />
        <line x1={top.bl[0]} y1={top.bl[1]} x2={top.br[0]} y2={top.br[1]} stroke="#5C3317" strokeWidth="4" />
        <line x1={top.fl[0]} y1={top.fl[1]} x2={top.bl[0]} y2={top.bl[1]} stroke="#5C3317" strokeWidth="2.5" />
        <line x1={top.fr[0]} y1={top.fr[1]} x2={top.br[0]} y2={top.br[1]} stroke="#5C3317" strokeWidth="2.5" />

        {/* עמודים */}
        {posts.map((post, i) => (
          <g key={`p${i}`}>
            <line x1={post.b[0]} y1={post.b[1]} x2={post.t[0]} y2={post.t[1]}
              stroke="#5C3317" strokeWidth="5" strokeLinecap="round" />
            {/* בסיס בטון */}
            <rect x={post.b[0] - 6} y={post.b[1]} width={12} height={5} fill="#999" opacity="0.4" rx="1" />
          </g>
        ))}

        {/* קיר */}
        {attachType === 'wall' && (
          <>
            <line x1={top.bl[0] - 3} y1={top.bl[1] - 15} x2={top.br[0] - 3} y2={top.br[1] - 15}
              stroke="#999" strokeWidth="12" opacity="0.15" />
            <text x={(top.bl[0] + top.br[0]) / 2} y={(top.bl[1] + top.br[1]) / 2 - 20}
              textAnchor="middle" fontSize="9" fill="#999">קיר בניין</text>
          </>
        )}

        {/* מידות */}
        <text x={ox - w / 2} y={oy + 22} textAnchor="middle" fontSize="14" fill="#1F3864" fontWeight="bold">
          {width} מ' (W)
        </text>
        <text x={ox + l / 2 + 12} y={oy - l / 2 + 6} textAnchor="start" fontSize="14" fill="#1F3864" fontWeight="bold">
          {length} מ' (L)
        </text>
        <text x={ox - w - 10} y={oy - h / 2} textAnchor="end" fontSize="12" fill="#666">
          {height} מ'
        </text>

        {/* מקרא */}
        <rect x={pad - 10} y={svgH - 65} width={svgW - pad * 2 + 20} height={55} fill="white" rx="6" stroke="#eee" />
        <text x={svgW - pad} y={svgH - 46} textAnchor="end" fontSize="11" fill="#1a1c19" fontWeight="bold">
          {postCount} עמודים | {attachType === 'wall' ? 'צמודת קיר' : 'עצמאית'}
        </text>
        <text x={svgW - pad} y={svgH - 32} textAnchor="end" fontSize="10" fill="#666">
          תומך: {supportSection || '—'} | תשתית: {baseBeamSection || '—'} | גג: 5x10
        </text>
        <text x={svgW - pad} y={svgH - 18} textAnchor="end" fontSize="10" fill="#666">
          {Math.round(width * length)} מ"ר{hasRoof ? ` | קירוי: ${roofNames[roofType]}` : ''}
        </text>
      </svg>
    </div>
  )
}
