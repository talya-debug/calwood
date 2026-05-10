import pool from './db.js'

export default async function handler(req, res) {
  try {
    // מוחק את הטבלה הישנה ויוצר חדשה
    await pool.query('DROP TABLE IF EXISTS materials CASCADE')
    await pool.query(`
      CREATE TABLE materials (
        id serial PRIMARY KEY,
        profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        mat_id integer NOT NULL,
        category text NOT NULL,
        name text NOT NULL,
        width numeric DEFAULT 0,
        height numeric DEFAULT 0,
        piece_length numeric DEFAULT 0,
        board_width numeric DEFAULT 0,
        pack_size integer DEFAULT 0,
        coverage numeric DEFAULT 0,
        unit text DEFAULT '',
        price_per_unit numeric DEFAULT 0,
        supplier text DEFAULT '',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS idx_materials_profile ON materials(profile_id)')
    res.json({ ok: true, message: 'Materials table recreated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
