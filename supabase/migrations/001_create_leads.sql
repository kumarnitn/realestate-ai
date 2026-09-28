create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  property_requirement text not null,
  budget text not null,
  buying_timeline text not null,
  customer_message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
