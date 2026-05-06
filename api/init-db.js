import pool from './db.js'

const schema = `
-- CalWood Database Schema

-- פרופילים
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  email text DEFAULT '',
  owner_name text DEFAULT '',
  business_name text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  license_number text DEFAULT '',
  hourly_rate numeric DEFAULT 250,
  helper_daily numeric DEFAULT 900,
  overhead_pct numeric DEFAULT 5,
  profit_pct numeric DEFAULT 20,
  safety_pct numeric DEFAULT 5,
  supplier_discount numeric DEFAULT 0,
  pergola_days_with_helper numeric DEFAULT 3,
  pergola_days_alone numeric DEFAULT 5,
  deck_days_with_helper numeric DEFAULT 2,
  deck_days_alone numeric DEFAULT 3.5,
  logo_url text,
  brand_color text DEFAULT '#2d5a3d',
  quote_title text DEFAULT 'הצעת מחיר',
  payment_terms text DEFAULT '40% מקדמה בתחילת העבודה, 60% בסיום',
  warranty_text text DEFAULT 'אחריות 5 שנים על עבודה',
  validity_text text DEFAULT 'ההצעה בתוקף ל-14 יום',
  included_list jsonb DEFAULT '["חומרים","עבודה","הובלה לאתר","שימון/לכה","בסיסי בטון"]',
  excluded_list jsonb DEFAULT '["תאורה / חשמל בפרגולה","ניקוז / אינסטלציה מתחת לדק","פינוי עודפי חומרים","הכנת שטח / פיזור אדמה"]',
  onboarding_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- מחירון
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

-- לקוחות
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

-- הצעות מחיר
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

CREATE INDEX IF NOT EXISTS idx_profiles_clerk ON profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_materials_profile ON materials(profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_profile ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_quotes_profile ON quotes(profile_id);
`

export default async function handler(req, res) {
  try {
    await pool.query(schema)
    res.status(200).json({ ok: true, message: 'Database initialized' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
