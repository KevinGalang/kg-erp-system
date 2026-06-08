create extension if not exists "pgcrypto";

create table if not exists public.pd_90_day_sale (
  id uuid primary key default gen_random_uuid(),
  product_title text not null,
  product_variant_title text not null,
  product_variant_sku text not null,
  week_start date not null,
  quantity numeric not null default 0,
  source_file text not null default 'PD 90 day Sales.xltm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_variant_sku, week_start)
);

create index if not exists pd_90_day_sale_sku_idx
on public.pd_90_day_sale (product_variant_sku);

create index if not exists pd_90_day_sale_week_start_idx
on public.pd_90_day_sale (week_start);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_pd_90_day_sale_updated_at on public.pd_90_day_sale;

create trigger set_pd_90_day_sale_updated_at
before update on public.pd_90_day_sale
for each row
execute function public.set_updated_at();
