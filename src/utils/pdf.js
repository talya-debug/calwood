/**
 * יצירת PDF — הצעת מחיר + כתב כמויות
 * הצעת מחיר = ללקוח (בלי פירוט מחירים, בלי רווח ותקורה)
 * כתב כמויות = לקבלן (פירוט חומרים + עלויות)
 */
import html2pdf from 'html2pdf.js'
import { filterIncluded } from './quoteText'

function fmt(n) {
  return Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 2 })
}

/**
 * הצעת מחיר — ללקוח
 * תיאור פרויקט + מה כלול + מחיר סופי
 */
export function generateQuotePDF(result, clientInfo, profile, branding) {
  const { html, filename } = buildQuoteHtml(result, clientInfo, profile, branding)
  return downloadPDF(html, filename)
}

export function buildQuoteHtml(result, clientInfo, profile, branding) {
  const typeNames = { pergola: 'פרגולה', deck: 'דק', custom: 'עבודה מותאמת' }
  const typeName = typeNames[result.type] || result.type
  const dims = result.dimensions || {}
  const dimsText = dims.width && dims.length ? `${dims.length} x ${dims.width} מ'` : ''
  const dateStr = new Date().toLocaleDateString('he-IL')
  const brandColor = branding.brand_color || '#1F3864'

  // תיאור — אם הקבלן ערך, משתמש בטקסט שלו
  let projectDesc = result._customDesc || `${typeName} ${dimsText}${result.area ? ` (${fmt(result.area)} מ"ר)` : ''}`
  let engDetails = result._customDetails || ''
  if (!result._customDetails) {
    const parts = []
    if (result.engineering?.postCount) parts.push(`${result.engineering.postCount} עמודים`)
    if (dims.postSize) parts.push(`עמוד ${dims.postSize}`)
    if (dims.attachType === 'wall') parts.push('צמודת קיר')
    if (dims.roofType && dims.roofType !== 'none') {
      const rn = { santef: 'סנטף', bh: 'BH גלי', thermo: 'עץ טרמו' }
      parts.push(`קירוי ${rn[dims.roofType] || ''}`)
    }
    if (dims.woodType) {
      const wn = { pine: 'אורן', bamboo_d: 'במבוק כהה', bamboo_l: 'במבוק בהיר', ipe: 'איפאה', ipe_prem: 'איפאה פרמיום', cumaru: 'קומרו', sucupira: 'סוקופירה' }
      parts.push(wn[dims.woodType] || '')
    }
    engDetails = parts.join(' | ')
  }
  const customNotes = result._customNotes || ''

  // רשימת כלול / לא כלול
  const included = filterIncluded(branding.included_list, result)
  const includedList = included.length > 0
    ? included.map(i => `<li style="padding:3px 0;">${i}</li>`).join('')
    : ''

  const excludedList = (branding.excluded_list && branding.excluded_list.length > 0)
    ? branding.excluded_list.map(i => `<li style="padding:3px 0;color:#999;">${i}</li>`).join('')
    : ''

  const customTimeline = result._customTimeline || ''

  const html = `
    <div style="direction:rtl;font-family:'Rubik','Segoe UI',Arial,sans-serif;color:#1a1c1a;padding:24px;max-width:620px;font-size:13px;line-height:1.6;">
      <!-- כותרת עסק -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;margin-bottom:20px;border-bottom:3px solid #2d5a3d;">
        <div style="text-align:left;font-size:11px;color:#aaa;">
          <div>תאריך: ${dateStr}</div>
        </div>
        <div style="text-align:right;">
          ${branding.logo_url ? `<img src="${branding.logo_url}" style="max-height:50px;margin-bottom:8px;" />` : ''}
          <div style="font-size:24px;font-weight:700;color:#2d5a3d;">${profile.business_name || ''}</div>
          ${profile.owner_name ? `<div style="font-size:13px;color:#555;margin-top:2px;">${profile.owner_name}</div>` : ''}
          <div style="font-size:11px;color:#999;margin-top:4px;">${[profile.phone, profile.email, profile.address].filter(Boolean).join(' | ')}</div>
          ${profile.license_number ? `<div style="font-size:10px;color:#bbb;">ח.פ. ${profile.license_number}</div>` : ''}
        </div>
      </div>

      <!-- כותרת הצעה -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:800;color:#2d5a3d;">${branding.quote_title || 'הצעת מחיר'}</div>
      </div>

      <!-- פנייה ללקוח -->
      <div style="background:#f7f7f4;border-radius:10px;padding:16px 22px;margin-bottom:22px;font-size:14px;color:#444;line-height:1.8;white-space:pre-line;">${result._customGreeting || (clientInfo?.name ? `לכבוד ${clientInfo.name},\nתודה על פנייתך. להלן הצעת מחיר עבור העבודה המבוקשת:` : 'להלן הצעת מחיר עבור העבודה המבוקשת:')}</div>

      <!-- תיאור העבודה -->
      <div style="margin-bottom:22px;">
        <div style="font-size:13px;font-weight:700;color:#555;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #2d5a3d;">תיאור העבודה</div>
        <div style="font-size:14px;color:#333;line-height:1.9;white-space:pre-line;padding:12px 16px;background:white;border:1px solid #eee;border-radius:10px;">${projectDesc}</div>
      </div>

      ${customNotes ? `
        <div style="margin-bottom:22px;">
          <div style="font-size:13px;font-weight:700;color:#555;margin-bottom:6px;">הערות</div>
          <div style="font-size:13px;color:#555;padding:10px 14px;background:#fafafa;border-radius:8px;">${customNotes}</div>
        </div>
      ` : ''}

      <!-- מחיר -->
      <div style="border:2px solid #2d5a3d;border-radius:14px;overflow:hidden;margin-bottom:22px;">
        <div style="padding:20px;text-align:center;background:#2d5a3d08;">
          <div style="display:flex;justify-content:center;gap:40px;margin-bottom:16px;">
            <div><div style="font-size:11px;color:#888;">שטח</div><div style="font-size:18px;font-weight:700;">${fmt(result.area)} מ"ר</div></div>
            <div><div style="font-size:11px;color:#888;">מחיר/מ"ר לפני מע"מ</div><div style="font-size:18px;font-weight:700;">${fmt(result.totals.pricePerSqm)} &#8362;</div></div>
            <div><div style="font-size:11px;color:#888;">ימי עבודה</div><div style="font-size:18px;font-weight:700;">${result.labor?.days || ''}</div></div>
          </div>
          <div style="border-top:1px solid #2d5a3d20;padding-top:14px;">
            <div style="font-size:13px;color:#888;">לפני מע"מ</div>
            <div style="font-size:24px;font-weight:700;color:#1a1c19;">${fmt(result.totals.beforeVat)} &#8362;</div>
          </div>
        </div>
        <div style="padding:18px;text-align:center;background:#e8f5e9;">
          <div style="font-size:11px;color:#888;">מע"מ (18%): ${fmt(result.totals.vat)} &#8362;</div>
          <div style="font-size:36px;font-weight:800;color:#375623;margin-top:4px;">${fmt(result.totals.total)} &#8362;</div>
          <div style="font-size:14px;color:#375623;font-weight:600;">סה"כ כולל מע"מ</div>
        </div>
      </div>

      ${customTimeline ? `<div style="font-size:13px;color:#555;margin-bottom:18px;"><strong>לוח זמנים:</strong> ${customTimeline}</div>` : ''}

      <!-- כלול / לא כלול -->
      <div style="display:flex;gap:16px;margin-bottom:22px;">
        ${includedList ? `
          <div style="flex:1;background:#f0faf0;border-radius:10px;padding:14px 16px;">
            <div style="font-size:13px;font-weight:700;color:#375623;margin-bottom:8px;">העבודה כוללת</div>
            <ul style="margin:0;padding:0 14px;font-size:12px;color:#555;line-height:1.8;">${includedList}</ul>
          </div>
        ` : ''}
        ${excludedList ? `
          <div style="flex:1;background:#f8f8f8;border-radius:10px;padding:14px 16px;">
            <div style="font-size:13px;font-weight:700;color:#999;margin-bottom:8px;">לא כלול</div>
            <ul style="margin:0;padding:0 14px;font-size:12px;color:#aaa;line-height:1.8;">${excludedList}</ul>
          </div>
        ` : ''}
      </div>

      <!-- תנאים -->
      <div style="font-size:11px;color:#999;border-top:1px solid #eee;padding-top:14px;line-height:2;">
        ${branding.payment_terms ? `<div><strong style="color:#666;">תנאי תשלום:</strong> ${branding.payment_terms}</div>` : ''}
        ${branding.warranty_text ? `<div><strong style="color:#666;">אחריות:</strong> ${branding.warranty_text}</div>` : ''}
        ${branding.validity_text ? `<div>${branding.validity_text}</div>` : ''}
      </div>

      <!-- חתימה -->
      <div style="margin-top:24px;font-size:13px;color:#444;line-height:1.8;white-space:pre-line;">${result._customClosing || `בברכה,\n${profile.owner_name || profile.business_name || ''}`}</div>
    </div>
  `

  return { html, filename: `הצעת_מחיר_${typeName}_${dims.width || ''}x${dims.length || ''}.pdf` }
}

/**
 * כתב כמויות — לקבלן (פירוט מלא)
 */
export function generateMaterialsPDF(result, profile) {
  const { html, filename } = buildMaterialsHtml(result, profile)
  return downloadPDF(html, filename)
}

export function buildMaterialsHtml(result, profile) {
  const typeNames = { pergola: 'פרגולה', deck: 'דק', custom: 'עבודה מותאמת' }
  const typeName = typeNames[result.type] || result.type
  const dims = result.dimensions || {}
  const dimsText = dims.width && dims.length ? `${dims.length} x ${dims.width} מ'` : ''
  const dateStr = new Date().toLocaleDateString('he-IL')

  const rows = result.lineItems.map(item => `
    <tr style="page-break-inside:avoid;">
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:500;">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;">${fmt(item.quantity)} ${item.unit || ''}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;color:#666;font-size:12px;">${item.detail || ''}
        ${item.cutPlan?.length ? `<div style="margin-top:6px;padding:6px 8px;background:#f0faf0;border-radius:6px;color:#2d5a3d;font-size:11px;line-height:1.6;"><strong>תוכנית חיתוך:</strong><br>${item.cutPlan.join('<br>')}</div>` : ''}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:left;font-weight:600;white-space:nowrap;">${fmt(item.cost)} &#8362;</td>
    </tr>
  `).join('')

  // חתכים הנדסיים — רק מה שבאמת חושב (בלי "—")
  const eng = result.engineering || {}
  const engParts = [
    eng.supportSection && `${eng.supportCount || ''} תומכי תשתית ${eng.supportSection}`,
    eng.baseBeamSection && `${eng.baseBeamCount || ''} קורות תשתית ${eng.baseBeamSection}`,
    eng.roofBeamSection && `${eng.roofBeamCount || ''} קורות גג ${eng.roofBeamSection}`,
    eng.postCount && `${eng.postCount} עמודים`,
    result.type === 'deck' && eng.joistCount && `${eng.joistCount} קורות תשתית באורך ${fmt(eng.joistLength)} מ'`,
    result.type === 'deck' && eng.boardRows && `${eng.boardRows} שורות קרשים × ${eng.boardsPerRow}`,
  ].filter(Boolean)
  const engNote = engParts.length ? `<div style="background:#f0f4ff;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#1F3864;">
      <strong>${result.type === 'deck' ? 'מבנה:' : 'חתכים הנדסיים:'}</strong> ${engParts.join(' | ')}
    </div>` : ''

  const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;color:#1a1c19;padding:20px;max-width:700px;">
      <div style="border-bottom:3px solid #375623;padding-bottom:16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end;">
        <div style="font-size:12px;color:#888;">${dateStr}</div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:700;color:#375623;">כתב כמויות</div>
          <div style="font-size:14px;color:#1F3864;margin-top:4px;">${typeName} ${dimsText}</div>
          ${profile.business_name ? `<div style="font-size:12px;color:#666;margin-top:4px;">${profile.business_name}</div>` : ''}
        </div>
      </div>

      ${engNote}

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#375623;color:white;">
            <th style="padding:10px 14px;text-align:right;">פריט</th>
            <th style="padding:10px 14px;text-align:center;">כמות</th>
            <th style="padding:10px 14px;text-align:center;">פירוט</th>
            <th style="padding:10px 14px;text-align:left;">עלות</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="margin-top:20px;text-align:left;font-size:16px;">
        <strong>סה"כ חומרים: ${fmt(result.totals.materials)} &#8362;</strong>
      </div>
    </div>
  `

  return { html, filename: `כתב_כמויות_${typeName}_${dims.width || ''}x${dims.length || ''}.pdf` }
}

// === עזר — הורדת PDF ===
// רוחב קבוע (בערך רוחב A4) — כדי שבנייד המסמך לא יתכווץ לרוחב המסך וייחתך
const PDF_RENDER_WIDTH = 720

export function buildPdfOptions(filename) {
  return {
    margin: [10, 10, 12, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, windowWidth: PDF_RENDER_WIDTH, scrollX: 0, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    // לא חותכים בלוק באמצע בין עמודים
    pagebreak: { mode: ['avoid-all', 'css'] },
  }
}

// מכין את המסמך מחוץ למסך, ברוחב קבוע
export function mountPdfContainer(html) {
  const container = document.createElement('div')
  container.style.cssText = `position:fixed;top:0;left:-10000px;width:${PDF_RENDER_WIDTH}px;background:#fff;`
  container.innerHTML = html
  const root = container.firstElementChild
  root.style.maxWidth = 'none'
  root.style.width = `${PDF_RENDER_WIDTH}px`
  root.style.boxSizing = 'border-box'
  document.body.appendChild(container)
  return { container, root }
}

let pdfBusy = false

async function downloadPDF(html, filename) {
  // לחיצה כפולה בזמן הפקה — מתעלמים, כדי שלא ייווצרו שתי הורדות במקביל
  if (pdfBusy) return
  pdfBusy = true
  const { container, root } = mountPdfContainer(html)
  try {
    // מחכים לפונטים, אחרת העברית עלולה לצאת בפונט ברירת מחדל
    if (document.fonts?.ready) await document.fonts.ready
    // הערה: הספרייה יוצרת לרגע מסגרת נסתרת ריקה (about:blank) בתוך הדף כדי לצייר את המסמך, ומוחקת אותה בסוף.
    // זו לא לשונית — המשתמש לא רואה אותה.
    const blob = await html2pdf().set(buildPdfOptions(filename)).from(root).outputPdf('blob')
    saveBlob(blob, filename)
  } catch (err) {
    console.error('PDF failed', err)
    alert('לא הצלחנו להפיק PDF. נסו שוב, או מדפדפן אחר.')
  } finally {
    container.remove()
    pdfBusy = false
  }
}

// הורדה דרך קישור הורדה אחד, באותה לשונית — בלי לפתוח חלון חדש (גם בנייד)
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
