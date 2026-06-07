create extension if not exists "pgcrypto";

create table if not exists public.item_master_list (
  id uuid primary key default gen_random_uuid(),
  product_title text not null,
  product_variant_title text not null,
  product_variant_sku text not null unique,
  product_vendor text not null,
  uom text not null,
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

drop trigger if exists set_item_master_list_updated_at on public.item_master_list;

create trigger set_item_master_list_updated_at
before update on public.item_master_list
for each row
execute function public.set_updated_at();
