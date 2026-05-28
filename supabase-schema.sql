create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'Retailer',
  name text not null,
  mobile text,
  area text,
  customer_class text,
  specialty text,
  outstanding numeric default 0,
  address text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  composition text,
  category text,
  pack text,
  mrp numeric default 0,
  sale_rate numeric default 0,
  scheme text,
  stock numeric default 0,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  outcome text not null,
  notes text,
  user_name text,
  role text,
  visit_time text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer text not null,
  total numeric default 0,
  user_name text,
  role text,
  order_time text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.visits enable row level security;
alter table public.orders enable row level security;

drop policy if exists "testing read customers" on public.customers;
drop policy if exists "testing insert customers" on public.customers;
drop policy if exists "testing read products" on public.products;
drop policy if exists "testing insert products" on public.products;
drop policy if exists "testing read visits" on public.visits;
drop policy if exists "testing insert visits" on public.visits;
drop policy if exists "testing read orders" on public.orders;
drop policy if exists "testing insert orders" on public.orders;

create policy "testing read customers" on public.customers for select to anon using (true);
create policy "testing insert customers" on public.customers for insert to anon with check (true);

create policy "testing read products" on public.products for select to anon using (true);
create policy "testing insert products" on public.products for insert to anon with check (true);

create policy "testing read visits" on public.visits for select to anon using (true);
create policy "testing insert visits" on public.visits for insert to anon with check (true);

create policy "testing read orders" on public.orders for select to anon using (true);
create policy "testing insert orders" on public.orders for insert to anon with check (true);
