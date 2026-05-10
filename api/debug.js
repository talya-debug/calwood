import pool from './db.js'

export default async function handler(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `)
    const tables = rows.map(r => r.table_name)

    // בדיקת עמודות materials
    let matCols = []
    try {
      const { rows: cols } = await pool.query(`
        SELECT column_name, data_type FROM information_schema.columns
        WHERE table_name = 'materials' ORDER BY ordinal_position
      `)
      matCols = cols
    } catch (e) { matCols = [{ error: e.message }] }

    res.json({ tables, materials_columns: matCols })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
