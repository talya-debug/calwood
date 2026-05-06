import pool from './db.js'

// שליפת clerk_id מה-header (Clerk שולח אותו)
function getClerkId(req) {
  // בפרודקשן — Clerk JWT. כרגע — header פשוט
  return req.headers['x-clerk-user-id'] || ''
}

export default async function handler(req, res) {
  const clerkId = getClerkId(req)
  if (!clerkId) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    let { rows } = await pool.query('SELECT * FROM profiles WHERE clerk_id = $1', [clerkId])
    if (rows.length === 0) {
      // יצירת פרופיל חדש
      const r = await pool.query('INSERT INTO profiles (clerk_id) VALUES ($1) RETURNING *', [clerkId])
      rows = r.rows
    }
    return res.json(rows[0])
  }

  if (req.method === 'PUT') {
    const p = req.body
    const { rows } = await pool.query(`
      UPDATE profiles SET
        owner_name = COALESCE($2, owner_name),
        business_name = COALESCE($3, business_name),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        address = COALESCE($6, address),
        license_number = COALESCE($7, license_number),
        hourly_rate = COALESCE($8, hourly_rate),
        helper_daily = COALESCE($9, helper_daily),
        overhead_pct = COALESCE($10, overhead_pct),
        profit_pct = COALESCE($11, profit_pct),
        safety_pct = COALESCE($12, safety_pct),
        supplier_discount = COALESCE($13, supplier_discount),
        pergola_days_with_helper = COALESCE($14, pergola_days_with_helper),
        pergola_days_alone = COALESCE($15, pergola_days_alone),
        deck_days_with_helper = COALESCE($16, deck_days_with_helper),
        deck_days_alone = COALESCE($17, deck_days_alone),
        logo_url = COALESCE($18, logo_url),
        brand_color = COALESCE($19, brand_color),
        quote_title = COALESCE($20, quote_title),
        payment_terms = COALESCE($21, payment_terms),
        warranty_text = COALESCE($22, warranty_text),
        validity_text = COALESCE($23, validity_text),
        included_list = COALESCE($24, included_list),
        excluded_list = COALESCE($25, excluded_list),
        onboarding_done = COALESCE($26, onboarding_done),
        updated_at = now()
      WHERE clerk_id = $1
      RETURNING *
    `, [
      clerkId, p.owner_name, p.business_name, p.phone, p.email,
      p.address, p.license_number, p.hourly_rate, p.helper_daily,
      p.overhead_pct, p.profit_pct, p.safety_pct, p.supplier_discount,
      p.pergola_days_with_helper, p.pergola_days_alone,
      p.deck_days_with_helper, p.deck_days_alone,
      p.logo_url, p.brand_color, p.quote_title, p.payment_terms,
      p.warranty_text, p.validity_text,
      p.included_list ? JSON.stringify(p.included_list) : null,
      p.excluded_list ? JSON.stringify(p.excluded_list) : null,
      p.onboarding_done
    ])
    return res.json(rows[0])
  }

  res.status(405).end()
}
