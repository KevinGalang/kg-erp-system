create table if not exists public.shiphero_intransit_items (
  sku text primary key,
  quantity numeric not null default 0,
  source text not null default 'shiphero',
  synced_at timestamptz not null default now()
);

create index if not exists shiphero_intransit_items_synced_at_idx
on public.shiphero_intransit_items (synced_at desc);

