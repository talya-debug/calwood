import pool from './db.js'

function getClerkId(req) {
  return req.headers['x-clerk-user-id'] || ''
}

async function getProfileId(clerkId) {
  const { rows } = await pool.query('SELECT id FROM profiles WHERE clerk_id = $1', [clerkId])
  return rows[0]?.id
}

export default async function handler(req, res) {
  const clerkId = getClerkId(req)
  if (!clerkId) return res.status(401).json({ error: 'unauthorized' })
  const profileId = await getProfileId(clerkId)
  if (!profileId) return res.status(404).json({ error: 'profile not found' })

  if (req.method === 'GET') {
    const { rows } = await pool.query(
      'SELECT * FROM materials WHERE profile_id = $1 ORDER BY mat_id', [profileId])
    // אם אין חומרים — הקבלן חדש, לא שומרים דיפולט ל-DB
    return res.json(rows)
  }

  if (req.method === 'POST') {
    // שמירת מחירון מלא (מחליף את הכל)
    const items = req.body
    await pool.query('DELETE FROM materials WHERE profile_id = $1', [profileId])
    for (const m of items) {
      await pool.query(`
        INSERT INTO materials (profile_id, mat_id, category, name, width, height, piece_length, board_width, pack_size, coverage, unit, price_per_unit, supplier, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `, [profileId, m.id, m.category, m.name, m.width||0, m.height||0, m.piece_length||0, m.board_width||0, m.pack_size||0, m.coverage||0, m.unit, m.price_per_unit, m.supplier||'', m.is_active !== false])
    }
    return res.json({ ok: true })
  }

  res.status(405).end()
}
