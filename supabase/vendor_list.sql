create extension if not exists "pgcrypto";

create table if not exists public.vendor_list (
  id uuid primary key default gen_random_uuid(),
  mfg text not null unique,
  lead_time text not null,
  review_period text not null,
  order_at text not null,
  link text not null,
  username text not null,
  password text not null,
  contact text not null,
  email text not null,
  phone text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_vendor_list_updated_at on public.vendor_list;

create trigger set_vendor_list_updated_at
before update on public.vendor_list
for each row
execute function public.set_updated_at();
