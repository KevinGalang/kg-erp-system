create extension if not exists "pgcrypto";

create table if not exists public.discontinued_items (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  vendor text not null,
  sku text not null unique,
  replace_with text not null default '',
  status text not null default 'Discontinued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discontinued_items_vendor_idx
on public.discontinued_items (vendor);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_discontinued_items_updated_at on public.discontinued_items;

create trigger set_discontinued_items_updated_at
before update on public.discontinued_items
for each row
execute function public.set_updated_at();
