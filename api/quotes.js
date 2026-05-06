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
      'SELECT * FROM quotes WHERE profile_id = $1 ORDER BY created_at DESC', [profileId])
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const q = req.body
    const { rows } = await pool.query(`
      INSERT INTO quotes (profile_id, client_id, type, status, dimensions, result, client_info)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [profileId, q.client_id || null, q.type, q.status || 'draft',
        JSON.stringify(q.dimensions), JSON.stringify(q.result), JSON.stringify(q.client_info || {})])
    return res.json(rows[0])
  }

  if (req.method === 'PUT') {
    const q = req.body
    const { rows } = await pool.query(`
      UPDATE quotes SET status = COALESCE($2, status), updated_at = now()
      WHERE id = $1 AND profile_id = $3 RETURNING *
    `, [q.id, q.status, profileId])
    return res.json(rows[0])
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || req.body
    await pool.query('DELETE FROM quotes WHERE id = $1 AND profile_id = $2', [id, profileId])
    return res.json({ ok: true })
  }

  res.status(405).end()
}
