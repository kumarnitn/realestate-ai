alter table public.leads
  add column lead_summary text,
  add column customer_intent text,
  add column key_requirements jsonb,
  add column objections jsonb,
  add column recommended_next_action text,
  add column suggested_response text,
  add column score integer,
  add column priority text,
  add column analysis_status text default 'pending',
  add column analyzed_at timestamptz;
