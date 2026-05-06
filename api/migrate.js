import pool from './db.js'

const migration = `
-- הוספת עמודות חדשות לטבלת profiles (אם לא קיימות)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_number text DEFAULT '';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS safety_pct numeric DEFAULT 5;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS supplier_discount numeric DEFAULT 0;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pergola_days_with_helper numeric DEFAULT 3;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pergola_days_alone numeric DEFAULT 5;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deck_days_with_helper numeric DEFAULT 2;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deck_days_alone numeric DEFAULT 3.5;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url text;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#2d5a3d';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quote_title text DEFAULT 'הצעת מחיר';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT '40% מקדמה בתחילת העבודה, 60% בסיום';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warranty_text text DEFAULT 'אחריות 5 שנים על עבודה';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS validity_text text DEFAULT 'ההצעה בתוקף ל-14 יום';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS included_list jsonb DEFAULT '[]';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS excluded_list jsonb DEFAULT '[]';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false;

  -- עדכון ברירות מחדל
  UPDATE profiles SET overhead_pct = 5 WHERE overhead_pct = 15;
  UPDATE profiles SET profit_pct = 20 WHERE profit_pct = 25;
END $$;

-- טבלת מחירון (אם לא קיימת)
CREATE TABLE IF NOT EXISTS materials (
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
);

-- טבלת לקוחות
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text DEFAULT '',
  email text DEFAULT '',
  city text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  source text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- טבלת הצעות
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'pergola',
  status text NOT NULL DEFAULT 'draft',
  dimensions jsonb DEFAULT '{}',
  result jsonb DEFAULT '{}',
  client_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ניקוי test data
DELETE FROM profiles WHERE clerk_id = 'test123';
`

export default async function handler(req, res) {
  try {
    await pool.query(migration)
    res.status(200).json({ ok: true, message: 'Migration completed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
