create extension if not exists "pgcrypto";

create type user_role as enum ('customer', 'admin');
create type order_status as enum ('pending_payment', 'paid_mock', 'shipped', 'completed', 'cancelled');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  size text,
  color text,
  created_at timestamptz not null default now(),
  unique(user_id, product_id, size, color)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status order_status not null default 'pending_payment',
  total_amount numeric(10,2) not null check (total_amount >= 0),
  recipient_name text not null,
  phone text not null,
  address text not null,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  size text,
  color text,
  product_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "Users can read own profile" on profiles for select using (auth.uid() = id or public.is_admin());
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Anyone can read categories" on categories for select using (true);
create policy "Admins manage categories" on categories for all using (public.is_admin()) with check (public.is_admin());

create policy "Anyone can read active products" on products for select using (is_active = true or public.is_admin());
create policy "Admins manage products" on products for all using (public.is_admin()) with check (public.is_admin());

create policy "Users manage own cart" on cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read own orders" on orders for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins update orders" on orders for update using (public.is_admin());

create policy "Users read own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or public.is_admin()))
);
create policy "Users create own order items" on order_items for insert with check (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

insert into categories (name, slug, description) values
  ('女士精选', 'women', '通勤、针织与轻外套'),
  ('男士日常', 'men', '衬衫、夹克与基础款'),
  ('运动休闲', 'sport', '卫衣、运动裤和舒适套装'),
  ('鞋包配饰', 'accessories', '鞋履、包袋与搭配单品')
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price, original_price, stock, sizes, colors, image_url, is_active)
select c.id, '云感羊毛针织开衫', 'cloud-wool-cardigan', '细腻羊毛混纺，适合办公室和周末出行。', 399, 499, 36, array['S','M','L'], array['燕麦白','雾灰','墨黑'], 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', true
from categories c where c.slug = 'women'
on conflict (slug) do nothing;

insert into products (category_id, name, slug, description, price, original_price, stock, sizes, colors, image_url, is_active)
select c.id, '立体剪裁轻量夹克', 'light-utility-jacket', '防泼水面料，多口袋设计，城市通勤友好。', 459, 599, 28, array['M','L','XL','XXL'], array['岩石灰','深海蓝'], 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80', true
from categories c where c.slug = 'men'
on conflict (slug) do nothing;
