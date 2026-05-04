-- ============================================
-- Timber Logic — Database Schema (Neon + Clerk)
-- Auth מנוהל ע"י Clerk, DB ב-Neon
-- ============================================

-- 1. Profiles (קבלנים)
-- clerk_id = מזהה המשתמש מ-Clerk
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_id text not null unique,
  email text not null default '',
  name text not null default '',
  business_name text not null default '',
  phone text default '',
  hourly_rate numeric not null default 250,
  helper_daily numeric not null default 900,
  worker_daily numeric not null default 1300,
  overhead_pct numeric not null default 15,
  profit_pct numeric not null default 25,
  subscription_plan text not null default 'free',
  subscription_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Branding (מיתוג + תבנית הצעה)
create table if not exists user_branding (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  logo_url text,
  brand_color text not null default '#1F3864',
  secondary_color text not null default '#375623',
  quote_title text not null default 'הצעת מחיר',
  top_disclaimer text not null default 'כל המחירים כוללים מע"מ',
  payment_terms text not null default '40% מקדמה בחתימה | 30% בהגעת חומרים | 30% בסיום',
  warranty_text text not null default '',
  bottom_disclaimer text not null default 'ההצעה בתוקף 14 יום מתאריך ההנפקה',
  included_list jsonb not null default '[]'::jsonb,
  excluded_list jsonb not null default '[]'::jsonb,
  terms_pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Materials (מחירון חומרים)
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade, -- null = ברירת מחדל מערכת
  category text not null,
  name text not null,
  dimension text default '',
  unit text not null default 'יח׳',
  price_per_unit numeric not null default 0,
  supplier text default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Calc Rules (כללי חישוב)
create table if not exists calc_rules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade, -- null = ברירת מחדל מערכת
  rule_key text not null,
  value numeric not null,
  label text not null,
  help_text text default '',
  unit text default '',
  min_value numeric,
  max_value numeric,
  category text not null default 'general',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, rule_key)
);

-- 5. Engineering Tables (טבלאות הנדסיות)
create table if not exists engineering_tables (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  table_type text not null,
  condition_value numeric not null,
  result_value text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Work Types (סוגי עבודה)
create table if not exists work_types (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  icon text default 'hammer',
  calc_method text not null default 'sqm',
  default_price_per_unit numeric not null default 0,
  default_days_per_unit numeric not null default 1,
  materials_template jsonb not null default '[]'::jsonb,
  is_builtin boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 7. Clients (לקוחות)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  address text default '',
  city text default '',
  notes text default '',
  source text default '',
  is_vip boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Projects / Quotes (הצעות מחיר)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  work_type_id uuid references work_types(id) on delete set null,
  title text not null default '',
  status text not null default 'draft',
  dimensions_json jsonb not null default '{}'::jsonb,
  calculation_json jsonb not null default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  total_materials numeric not null default 0,
  total_labor numeric not null default 0,
  total_overhead numeric not null default 0,
  total_profit numeric not null default 0,
  total_before_vat numeric not null default 0,
  vat numeric not null default 0,
  total_price numeric not null default 0,
  quote_pdf_url text,
  quote_number text,
  valid_until date,
  notes text default '',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_profiles_clerk on profiles(clerk_id);
create index if not exists idx_materials_profile on materials(profile_id);
create index if not exists idx_materials_category on materials(category);
create index if not exists idx_calc_rules_profile on calc_rules(profile_id);
create index if not exists idx_calc_rules_key on calc_rules(rule_key);
create index if not exists idx_engineering_profile on engineering_tables(profile_id);
create index if not exists idx_work_types_profile on work_types(profile_id);
create index if not exists idx_clients_profile on clients(profile_id);
create index if not exists idx_projects_profile on projects(profile_id);
create index if not exists idx_projects_client on projects(client_id);
create index if not exists idx_projects_status on projects(status);
