alter table public.shopify_inventory_snapshots
  add column if not exists current_qty numeric not null default 0,
  add column if not exists on_order numeric not null default 0,
  add column if not exists sell_90_day numeric not null default 0,
  add column if not exists weekly_sell_rate numeric not null default 0,
  add column if not exists amount_needed numeric not null default 0,
  add column if not exists qty_approved numeric not null default 0,
  add column if not exists days_of_inventory numeric not null default 0,
  add column if not exists status text not null default 'Healthy',
  add column if not exists lead_time text not null default '',
  add column if not exists review_period text not null default '',
  add column if not exists lead_time_weeks numeric not null default 0,
  add column if not exists review_period_weeks numeric not null default 0,
  add column if not exists uom numeric not null default 1;

create index if not exists shopify_inventory_snapshots_snapshot_date_idx
on public.shopify_inventory_snapshots (snapshot_date desc);

create index if not exists shopify_inventory_snapshots_sku_idx
on public.shopify_inventory_snapshots (sku);
