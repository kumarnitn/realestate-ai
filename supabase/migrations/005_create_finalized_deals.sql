-- 005_create_finalized_deals.sql
-- Run this in your Supabase SQL Editor if you wish to store finalized deals in Supabase

create table if not exists public.finalized_deals (
  id text primary key default gen_random_uuid()::text,
  deal_type text not null,
  finalized_at timestamptz not null default now(),
  client_name text not null,
  property_title text,
  agreed_price text not null,
  token_advance text,
  closing_date text,
  agent_notes text,
  lead_details jsonb,
  property_details jsonb,
  created_at timestamptz not null default now()
);

alter table public.finalized_deals enable row level security;

create policy "Allow all read operations on finalized_deals"
  on public.finalized_deals for select
  using (true);

create policy "Allow all insert operations on finalized_deals"
  on public.finalized_deals for insert
  with check (true);

create policy "Allow all delete operations on finalized_deals"
  on public.finalized_deals for delete
  using (true);
