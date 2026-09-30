-- 004_create_properties.sql
-- Run this in your Supabase SQL Editor if you wish to store property inventory in Supabase

create table if not exists public.properties (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  property_type text not null,
  location text not null,
  price text not null,
  numeric_price numeric,
  area_sqft numeric,
  status text not null default 'Available',
  amenities jsonb default '[]'::jsonb,
  description text,
  floor_number text,
  possession_status text default 'Ready to Move',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS and allow public access for demonstration
alter table public.properties enable row level security;

create policy "Allow all read operations on properties"
  on public.properties for select
  using (true);

create policy "Allow all insert operations on properties"
  on public.properties for insert
  with check (true);

create policy "Allow all update operations on properties"
  on public.properties for update
  using (true);

create policy "Allow all delete operations on properties"
  on public.properties for delete
  using (true);
