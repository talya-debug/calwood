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
      'SELECT * FROM clients WHERE profile_id = $1 ORDER BY created_at DESC', [profileId])
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const c = req.body
    const { rows } = await pool.query(`
      INSERT INTO clients (profile_id, name, phone, email, city, address, notes, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [profileId, c.name, c.phone || '', c.email || '', c.city || '', c.address || '', c.notes || '', c.source || ''])
    return res.json(rows[0])
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || req.body
    await pool.query('DELETE FROM clients WHERE id = $1 AND profile_id = $2', [id, profileId])
    return res.json({ ok: true })
  }

  res.status(405).end()
}
