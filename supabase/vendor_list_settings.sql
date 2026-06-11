alter table public.vendor_list
add column if not exists settings jsonb not null default '{}'::jsonb;
