-- ============================================================================
-- BASKONIA MENDI TALDEA · SUPABASE SCHEMA & SEED DATA (2026)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- ============================================================================

-- 1. Tabla de Actividades (Ikastaroak, Irteerak, Jardunaldiak, Ekitaldiak)
create table if not exists public.activities (
  id text primary key,
  category text not null check (category in ('ikastaroa', 'irteera', 'jardunaldia', 'ekitaldia')),
  sort_order int not null default 10,
  visible_in_cards boolean not null default true,
  visible_in_calendar boolean not null default true,
  title_eu text not null,
  title_es text not null,
  summary_eu text not null default '',
  summary_es text not null default '',
  date_badge_eu text not null default '',
  date_badge_es text not null default '',
  cal_day text not null default '',
  cal_month_eu text not null default '',
  cal_month_es text not null default '',
  cal_subtitle_eu text not null default '',
  cal_subtitle_es text not null default '',
  image text not null default '',
  capacity int not null default 0,
  occupied int not null default 0,
  status text not null default 'open' check (status in ('open', 'full', 'soon', 'closed')),
  registration_enabled boolean not null default true,
  days int,
  km text,
  elevation text,
  level_eu text default 'Ertaina',
  level_es text default 'Media',
  info jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2. Tabla de Inscripciones (Izena-emateak)
create table if not exists public.izena_emateak (
  id uuid primary key default gen_random_uuid(),
  activity_key text not null references public.activities(id) on delete cascade,
  activity_title text not null,
  izena text not null,
  abizenak text not null,
  nan text default '',
  jaiotza date,
  telefonoa text default '',
  eposta text not null,
  bazkidea boolean not null default true,
  bazkide_zenbakia text default '',
  oharrak text default '',
  created_at timestamptz not null default now()
);

-- 3. Tabla de Material de Alquiler (Neguko materiala)
create table if not exists public.materials (
  id text primary key,
  name_eu text not null,
  name_es text not null,
  price_eur numeric(6,2) not null default 3.00,
  unit_eu text not null default 'astea',
  unit_es text not null default 'semana',
  stock_total int not null default 10,
  stock_available int not null default 8,
  image text not null,
  available boolean not null default true
);

-- 4. Tabla de Rutas de Wikiloc
create table if not exists public.wikiloc_routes (
  id text primary key,
  title_eu text not null,
  title_es text not null,
  difficulty text not null default 'ertaina' check (difficulty in ('erraza', 'ertaina', 'zaila')),
  km text not null default '—',
  up_m text not null default '—',
  down_m text not null default '—',
  url text not null,
  sort_order int not null default 10
);

-- 5. Ajustes generales del club (horario oficina, tienda, tarifas refugio)
create table if not exists public.site_settings (
  id text primary key default 'default',
  office_hours_eu text not null default 'asteazkenetan zabalik · 19:00 – 21:00',
  office_hours_es text not null default 'abierta los miércoles · 19:00 – 21:00',
  shirt_price_eur numeric(6,2) not null default 18.00,
  shirt_sizes text[] not null default array['S','M','L','XL'],
  shirt_stock_note_eu text not null default 'Egoitzan eskuragarri',
  shirt_stock_note_es text not null default 'Disponible en la sede',
  updated_at timestamptz not null default now()
);

-- Políticas RLS para lectura pública e inserción de inscripciones
alter table public.activities enable row level security;
alter table public.izena_emateak enable row level security;
alter table public.materials enable row level security;
alter table public.wikiloc_routes enable row level security;
alter table public.site_settings enable row level security;

create policy "Public read activities" on public.activities for select using (true);
create policy "Public read materials" on public.materials for select using (true);
create policy "Public read wikiloc_routes" on public.wikiloc_routes for select using (true);
create policy "Public read site_settings" on public.site_settings for select using (true);
create policy "Public insert registrations" on public.izena_emateak for insert with check (true);
create policy "Authenticated full access activities" on public.activities for all using (true);
create policy "Authenticated full access registrations" on public.izena_emateak for all using (true);
create policy "Authenticated full access materials" on public.materials for all using (true);
create policy "Authenticated full access wikiloc" on public.wikiloc_routes for all using (true);
create policy "Authenticated full access settings" on public.site_settings for all using (true);
