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
  follow_up_date date,
  photo_urls jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  storage_path text not null,
  photo_url text not null,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.outlet_sessions (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  role text,
  customer text not null,
  area text,
  check_in_time text,
  check_out_time text,
  check_in_latitude numeric,
  check_in_longitude numeric,
  check_out_latitude numeric,
  check_out_longitude numeric,
  duration_minutes integer default 0,
  km_travelled numeric default 0,
  outcome text default 'Productive Call',
  notes text,
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

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  quantity numeric default 0,
  rate numeric default 0,
  line_total numeric default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  role text,
  status text not null,
  attendance_time text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.beat_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to text,
  area text,
  customer text,
  planned_date date default current_date,
  sequence_no integer default 1,
  status text not null default 'Planned',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to text,
  priority text default 'Normal',
  due_date date default current_date,
  status text default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scheme_type text,
  product text,
  customer_segment text,
  rule_text text,
  valid_from date default current_date,
  valid_to date,
  status text default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  city text,
  area text not null,
  territory text,
  assigned_manager text,
  status text default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  role text,
  target_type text default 'Monthly Sales',
  product text,
  territory text,
  target_value numeric default 0,
  achieved_value numeric default 0,
  period text,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  product text,
  campaign_type text default 'Focus Product',
  content_url text,
  notes text,
  status text default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.retail_audits (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  customer text not null,
  shelf_share numeric default 0,
  competitor text,
  stock_status text,
  merchandising_notes text,
  image_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  audience text default 'All Field Users',
  priority text default 'Normal',
  status text default 'Published',
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  expense_type text,
  amount numeric default 0,
  notes text,
  status text default 'Submitted',
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  customer text not null,
  amount numeric default 0,
  mode text default 'Cash',
  invoice_no text,
  status text default 'Collected',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role text not null check (role in ('admin', 'manager', 'mr')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  employee_id text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists employee_id text;
alter table public.profiles add column if not exists phone text;

alter table public.outlet_sessions add column if not exists check_in_latitude numeric;
alter table public.outlet_sessions add column if not exists check_in_longitude numeric;
alter table public.outlet_sessions add column if not exists check_out_latitude numeric;
alter table public.outlet_sessions add column if not exists check_out_longitude numeric;
alter table public.visits add column if not exists follow_up_date date;
alter table public.visits add column if not exists photo_urls jsonb default '[]'::jsonb;

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.visits enable row level security;
alter table public.visit_photos enable row level security;
alter table public.outlet_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.attendance enable row level security;
alter table public.beat_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.schemes enable row level security;
alter table public.territories enable row level security;
alter table public.targets enable row level security;
alter table public.promotions enable row level security;
alter table public.retail_audits enable row level security;
alter table public.announcements enable row level security;
alter table public.expenses enable row level security;
alter table public.collections enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "testing read customers" on public.customers;
drop policy if exists "testing insert customers" on public.customers;
drop policy if exists "testing read products" on public.products;
drop policy if exists "testing insert products" on public.products;
drop policy if exists "testing read visits" on public.visits;
drop policy if exists "testing insert visits" on public.visits;
drop policy if exists "testing read outlet sessions" on public.outlet_sessions;
drop policy if exists "testing insert outlet sessions" on public.outlet_sessions;
drop policy if exists "testing read orders" on public.orders;
drop policy if exists "testing insert orders" on public.orders;
drop policy if exists "testing read order items" on public.order_items;
drop policy if exists "testing insert order items" on public.order_items;
drop policy if exists "testing read attendance" on public.attendance;
drop policy if exists "testing insert attendance" on public.attendance;
drop policy if exists "testing read beat plans" on public.beat_plans;
drop policy if exists "testing insert beat plans" on public.beat_plans;
drop policy if exists "testing update beat plans" on public.beat_plans;
drop policy if exists "testing read tasks" on public.tasks;
drop policy if exists "testing insert tasks" on public.tasks;
drop policy if exists "testing update tasks" on public.tasks;
drop policy if exists "testing read schemes" on public.schemes;
drop policy if exists "testing insert schemes" on public.schemes;
drop policy if exists "testing read territories" on public.territories;
drop policy if exists "testing insert territories" on public.territories;
drop policy if exists "testing read targets" on public.targets;
drop policy if exists "testing insert targets" on public.targets;
drop policy if exists "testing read promotions" on public.promotions;
drop policy if exists "testing insert promotions" on public.promotions;
drop policy if exists "testing read retail audits" on public.retail_audits;
drop policy if exists "testing insert retail audits" on public.retail_audits;
drop policy if exists "testing read announcements" on public.announcements;
drop policy if exists "testing insert announcements" on public.announcements;
drop policy if exists "testing read expenses" on public.expenses;
drop policy if exists "testing insert expenses" on public.expenses;
drop policy if exists "testing read collections" on public.collections;
drop policy if exists "testing insert collections" on public.collections;

create policy "testing read customers" on public.customers for select to anon using (true);
create policy "testing insert customers" on public.customers for insert to anon with check (true);

create policy "testing read products" on public.products for select to anon using (true);
create policy "testing insert products" on public.products for insert to anon with check (true);

create policy "testing read visits" on public.visits for select to anon using (true);
create policy "testing insert visits" on public.visits for insert to anon with check (true);

create policy "testing read outlet sessions" on public.outlet_sessions for select to anon using (true);
create policy "testing insert outlet sessions" on public.outlet_sessions for insert to anon with check (true);

create policy "testing read orders" on public.orders for select to anon using (true);
create policy "testing insert orders" on public.orders for insert to anon with check (true);

create policy "testing read order items" on public.order_items for select to anon using (true);
create policy "testing insert order items" on public.order_items for insert to anon with check (true);

create policy "testing read attendance" on public.attendance for select to anon using (true);
create policy "testing insert attendance" on public.attendance for insert to anon with check (true);

create policy "testing read beat plans" on public.beat_plans for select to anon using (true);
create policy "testing insert beat plans" on public.beat_plans for insert to anon with check (true);
create policy "testing update beat plans" on public.beat_plans for update to anon using (true) with check (true);

create policy "testing read tasks" on public.tasks for select to anon using (true);
create policy "testing insert tasks" on public.tasks for insert to anon with check (true);
create policy "testing update tasks" on public.tasks for update to anon using (true) with check (true);

create policy "testing read schemes" on public.schemes for select to anon using (true);
create policy "testing insert schemes" on public.schemes for insert to anon with check (true);

create policy "testing read territories" on public.territories for select to anon using (true);
create policy "testing insert territories" on public.territories for insert to anon with check (true);

create policy "testing read targets" on public.targets for select to anon using (true);
create policy "testing insert targets" on public.targets for insert to anon with check (true);

create policy "testing read promotions" on public.promotions for select to anon using (true);
create policy "testing insert promotions" on public.promotions for insert to anon with check (true);

create policy "testing read retail audits" on public.retail_audits for select to anon using (true);
create policy "testing insert retail audits" on public.retail_audits for insert to anon with check (true);

create policy "testing read announcements" on public.announcements for select to anon using (true);
create policy "testing insert announcements" on public.announcements for insert to anon with check (true);

create policy "testing read expenses" on public.expenses for select to anon using (true);
create policy "testing insert expenses" on public.expenses for insert to anon with check (true);

create policy "testing read collections" on public.collections for select to anon using (true);
create policy "testing insert collections" on public.collections for insert to anon with check (true);

drop policy if exists "testing read customers" on public.customers;
drop policy if exists "testing insert customers" on public.customers;
drop policy if exists "testing read products" on public.products;
drop policy if exists "testing insert products" on public.products;
drop policy if exists "testing read visits" on public.visits;
drop policy if exists "testing insert visits" on public.visits;
drop policy if exists "testing read outlet sessions" on public.outlet_sessions;
drop policy if exists "testing insert outlet sessions" on public.outlet_sessions;
drop policy if exists "testing read orders" on public.orders;
drop policy if exists "testing insert orders" on public.orders;
drop policy if exists "testing read order items" on public.order_items;
drop policy if exists "testing insert order items" on public.order_items;
drop policy if exists "testing read attendance" on public.attendance;
drop policy if exists "testing insert attendance" on public.attendance;
drop policy if exists "testing read beat plans" on public.beat_plans;
drop policy if exists "testing insert beat plans" on public.beat_plans;
drop policy if exists "testing update beat plans" on public.beat_plans;
drop policy if exists "testing read tasks" on public.tasks;
drop policy if exists "testing insert tasks" on public.tasks;
drop policy if exists "testing update tasks" on public.tasks;
drop policy if exists "testing read schemes" on public.schemes;
drop policy if exists "testing insert schemes" on public.schemes;
drop policy if exists "testing read territories" on public.territories;
drop policy if exists "testing insert territories" on public.territories;
drop policy if exists "testing read targets" on public.targets;
drop policy if exists "testing insert targets" on public.targets;
drop policy if exists "testing read promotions" on public.promotions;
drop policy if exists "testing insert promotions" on public.promotions;
drop policy if exists "testing read retail audits" on public.retail_audits;
drop policy if exists "testing insert retail audits" on public.retail_audits;
drop policy if exists "testing read announcements" on public.announcements;
drop policy if exists "testing insert announcements" on public.announcements;
drop policy if exists "testing read expenses" on public.expenses;
drop policy if exists "testing insert expenses" on public.expenses;
drop policy if exists "testing read collections" on public.collections;
drop policy if exists "testing insert collections" on public.collections;

drop policy if exists "authenticated read profiles" on public.profiles;
drop policy if exists "user insert own profile" on public.profiles;
drop policy if exists "user update own profile" on public.profiles;
create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "user insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "user update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "authenticated read customers" on public.customers;
drop policy if exists "authenticated insert customers" on public.customers;
drop policy if exists "authenticated update customers" on public.customers;
create policy "authenticated read customers" on public.customers for select to authenticated using (true);
create policy "authenticated insert customers" on public.customers for insert to authenticated with check (true);
create policy "authenticated update customers" on public.customers for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read products" on public.products;
drop policy if exists "authenticated insert products" on public.products;
drop policy if exists "authenticated update products" on public.products;
create policy "authenticated read products" on public.products for select to authenticated using (true);
create policy "authenticated insert products" on public.products for insert to authenticated with check (true);
create policy "authenticated update products" on public.products for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read visits" on public.visits;
drop policy if exists "authenticated insert visits" on public.visits;
drop policy if exists "authenticated update visits" on public.visits;
create policy "authenticated read visits" on public.visits for select to authenticated using (true);
create policy "authenticated insert visits" on public.visits for insert to authenticated with check (true);
create policy "authenticated update visits" on public.visits for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read visit photos" on public.visit_photos;
drop policy if exists "authenticated insert visit photos" on public.visit_photos;
drop policy if exists "authenticated update visit photos" on public.visit_photos;
create policy "authenticated read visit photos" on public.visit_photos for select to authenticated using (true);
create policy "authenticated insert visit photos" on public.visit_photos for insert to authenticated with check (true);
create policy "authenticated update visit photos" on public.visit_photos for update to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('visit-photos', 'visit-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "authenticated read visit photos storage" on storage.objects;
drop policy if exists "authenticated upload visit photos storage" on storage.objects;
drop policy if exists "authenticated update visit photos storage" on storage.objects;
create policy "authenticated read visit photos storage"
on storage.objects for select to authenticated
using (bucket_id = 'visit-photos');
create policy "authenticated upload visit photos storage"
on storage.objects for insert to authenticated
with check (bucket_id = 'visit-photos');
create policy "authenticated update visit photos storage"
on storage.objects for update to authenticated
using (bucket_id = 'visit-photos')
with check (bucket_id = 'visit-photos');

drop policy if exists "authenticated read outlet sessions" on public.outlet_sessions;
drop policy if exists "authenticated insert outlet sessions" on public.outlet_sessions;
drop policy if exists "authenticated update outlet sessions" on public.outlet_sessions;
create policy "authenticated read outlet sessions" on public.outlet_sessions for select to authenticated using (true);
create policy "authenticated insert outlet sessions" on public.outlet_sessions for insert to authenticated with check (true);
create policy "authenticated update outlet sessions" on public.outlet_sessions for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read orders" on public.orders;
drop policy if exists "authenticated insert orders" on public.orders;
drop policy if exists "authenticated update orders" on public.orders;
create policy "authenticated read orders" on public.orders for select to authenticated using (true);
create policy "authenticated insert orders" on public.orders for insert to authenticated with check (true);
create policy "authenticated update orders" on public.orders for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read order items" on public.order_items;
drop policy if exists "authenticated insert order items" on public.order_items;
drop policy if exists "authenticated update order items" on public.order_items;
create policy "authenticated read order items" on public.order_items for select to authenticated using (true);
create policy "authenticated insert order items" on public.order_items for insert to authenticated with check (true);
create policy "authenticated update order items" on public.order_items for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read attendance" on public.attendance;
drop policy if exists "authenticated insert attendance" on public.attendance;
drop policy if exists "authenticated update attendance" on public.attendance;
create policy "authenticated read attendance" on public.attendance for select to authenticated using (true);
create policy "authenticated insert attendance" on public.attendance for insert to authenticated with check (true);
create policy "authenticated update attendance" on public.attendance for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read beat plans" on public.beat_plans;
drop policy if exists "authenticated insert beat plans" on public.beat_plans;
drop policy if exists "authenticated update beat plans" on public.beat_plans;
create policy "authenticated read beat plans" on public.beat_plans for select to authenticated using (true);
create policy "authenticated insert beat plans" on public.beat_plans for insert to authenticated with check (true);
create policy "authenticated update beat plans" on public.beat_plans for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read tasks" on public.tasks;
drop policy if exists "authenticated insert tasks" on public.tasks;
drop policy if exists "authenticated update tasks" on public.tasks;
create policy "authenticated read tasks" on public.tasks for select to authenticated using (true);
create policy "authenticated insert tasks" on public.tasks for insert to authenticated with check (true);
create policy "authenticated update tasks" on public.tasks for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read schemes" on public.schemes;
drop policy if exists "authenticated insert schemes" on public.schemes;
drop policy if exists "authenticated update schemes" on public.schemes;
create policy "authenticated read schemes" on public.schemes for select to authenticated using (true);
create policy "authenticated insert schemes" on public.schemes for insert to authenticated with check (true);
create policy "authenticated update schemes" on public.schemes for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read territories" on public.territories;
drop policy if exists "authenticated insert territories" on public.territories;
drop policy if exists "authenticated update territories" on public.territories;
create policy "authenticated read territories" on public.territories for select to authenticated using (true);
create policy "authenticated insert territories" on public.territories for insert to authenticated with check (true);
create policy "authenticated update territories" on public.territories for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read targets" on public.targets;
drop policy if exists "authenticated insert targets" on public.targets;
drop policy if exists "authenticated update targets" on public.targets;
create policy "authenticated read targets" on public.targets for select to authenticated using (true);
create policy "authenticated insert targets" on public.targets for insert to authenticated with check (true);
create policy "authenticated update targets" on public.targets for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read promotions" on public.promotions;
drop policy if exists "authenticated insert promotions" on public.promotions;
drop policy if exists "authenticated update promotions" on public.promotions;
create policy "authenticated read promotions" on public.promotions for select to authenticated using (true);
create policy "authenticated insert promotions" on public.promotions for insert to authenticated with check (true);
create policy "authenticated update promotions" on public.promotions for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read retail audits" on public.retail_audits;
drop policy if exists "authenticated insert retail audits" on public.retail_audits;
drop policy if exists "authenticated update retail audits" on public.retail_audits;
create policy "authenticated read retail audits" on public.retail_audits for select to authenticated using (true);
create policy "authenticated insert retail audits" on public.retail_audits for insert to authenticated with check (true);
create policy "authenticated update retail audits" on public.retail_audits for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read announcements" on public.announcements;
drop policy if exists "authenticated insert announcements" on public.announcements;
drop policy if exists "authenticated update announcements" on public.announcements;
create policy "authenticated read announcements" on public.announcements for select to authenticated using (true);
create policy "authenticated insert announcements" on public.announcements for insert to authenticated with check (true);
create policy "authenticated update announcements" on public.announcements for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read expenses" on public.expenses;
drop policy if exists "authenticated insert expenses" on public.expenses;
drop policy if exists "authenticated update expenses" on public.expenses;
create policy "authenticated read expenses" on public.expenses for select to authenticated using (true);
create policy "authenticated insert expenses" on public.expenses for insert to authenticated with check (true);
create policy "authenticated update expenses" on public.expenses for update to authenticated using (true) with check (true);

drop policy if exists "authenticated read collections" on public.collections;
drop policy if exists "authenticated insert collections" on public.collections;
drop policy if exists "authenticated update collections" on public.collections;
create policy "authenticated read collections" on public.collections for select to authenticated using (true);
create policy "authenticated insert collections" on public.collections for insert to authenticated with check (true);
create policy "authenticated update collections" on public.collections for update to authenticated using (true) with check (true);
