-- Just Move store schema.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ─── Types ──────────────────────────────────────────────────────────────────
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type payment_method as enum ('cod', 'whish', 'omt', 'card');
create type payment_status as enum ('unpaid', 'awaiting_confirmation', 'paid', 'refunded');

-- ─── Admins ─────────────────────────────────────────────────────────────────
-- Add staff with: insert into admins (user_id) values ('<auth user id>');
create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ─── Store settings (single row) ────────────────────────────────────────────
create table store_settings (
  id boolean primary key default true check (id),
  delivery_fee numeric(10, 2) not null default 4,
  free_delivery_over numeric(10, 2),           -- null = never free
  whish_number text not null default '',
  omt_name text not null default '',
  card_enabled boolean not null default false,  -- flip on once a card gateway is connected
  updated_at timestamptz not null default now()
);
insert into store_settings default values;

-- ─── Catalog ────────────────────────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort int not null default 0
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  gender text not null check (gender in ('men', 'women')),
  category_id uuid references categories (id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  images text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index products_gender_idx on products (gender) where is_active;
create index products_category_idx on products (category_id);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  size text not null,
  color text not null default '',
  stock int not null default 0 check (stock >= 0),
  sort int not null default 0,
  unique (product_id, size, color)
);
create index product_variants_product_idx on product_variants (product_id);

-- ─── Orders ─────────────────────────────────────────────────────────────────
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  notes text,
  payment_method payment_method not null,
  payment_status payment_status not null default 'unpaid',
  payment_reference text,
  status order_status not null default 'pending',
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on orders (created_at desc);
create index orders_status_idx on orders (status);
create index orders_phone_idx on orders (phone);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  variant_id uuid references product_variants (id) on delete set null,
  product_name text not null,
  size text not null,
  color text not null default '',
  image text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on order_items (order_id);

-- ─── Row level security ─────────────────────────────────────────────────────
alter table admins enable row level security;
alter table store_settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "admins read self" on admins for select using (user_id = auth.uid());

create policy "settings public read" on store_settings for select using (true);
create policy "settings admin write" on store_settings for update using (is_admin());

create policy "categories public read" on categories for select using (true);
create policy "categories admin write" on categories for all using (is_admin()) with check (is_admin());

create policy "products public read" on products for select using (is_active or is_admin());
create policy "products admin write" on products for all using (is_admin()) with check (is_admin());

create policy "variants public read" on product_variants for select using (
  exists (select 1 from products p where p.id = product_id and (p.is_active or is_admin()))
);
create policy "variants admin write" on product_variants for all using (is_admin()) with check (is_admin());

-- Customers never touch orders directly; they go through place_order() / get_order().
create policy "orders admin read" on orders for select using (is_admin());
create policy "orders admin update" on orders for update using (is_admin());
create policy "order items admin read" on order_items for select using (is_admin());

-- ─── Placing an order ───────────────────────────────────────────────────────
-- Prices come from the database, never from the browser. Stock is locked and
-- decremented in the same transaction so two people can't buy the last piece.
create or replace function place_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method payment_method,
  p_payment_reference text default null
) returns table (id uuid, order_number bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_settings store_settings;
  v_item jsonb;
  v_qty int;
  v_variant record;
  v_subtotal numeric(10, 2) := 0;
  v_fee numeric(10, 2);
  v_order orders;
  v_name text := trim(coalesce(p_customer ->> 'name', ''));
  v_phone text := regexp_replace(coalesce(p_customer ->> 'phone', ''), '[^0-9+]', '', 'g');
  v_city text := trim(coalesce(p_customer ->> 'city', ''));
  v_address text := trim(coalesce(p_customer ->> 'address', ''));
begin
  select * into v_settings from store_settings limit 1;

  if length(v_name) < 2 or length(v_name) > 100 then raise exception 'Please enter your full name'; end if;
  if length(v_phone) < 7 or length(v_phone) > 16 then raise exception 'Please enter a valid phone number'; end if;
  if length(v_city) < 2 or length(v_city) > 60 then raise exception 'Please choose your city'; end if;
  if length(v_address) < 5 or length(v_address) > 300 then raise exception 'Please enter your delivery address'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your bag is empty'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Too many items in one order'; end if;
  if p_payment_method = 'card' and not v_settings.card_enabled then
    raise exception 'Card payment is not available yet';
  end if;
  if p_payment_method in ('whish', 'omt') and length(trim(coalesce(p_payment_reference, ''))) < 3 then
    raise exception 'Please enter your transfer reference number';
  end if;

  insert into orders (customer_name, phone, email, city, address, notes,
                      payment_method, payment_status, payment_reference,
                      subtotal, delivery_fee, total)
  values (v_name, v_phone, nullif(trim(coalesce(p_customer ->> 'email', '')), ''), v_city, v_address,
          nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 500), ''),
          p_payment_method,
          case when p_payment_method in ('whish', 'omt') then 'awaiting_confirmation'::payment_status else 'unpaid' end,
          nullif(trim(coalesce(p_payment_reference, '')), ''),
          0, 0, 0)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then raise exception 'Invalid quantity'; end if;

    select v.id, v.size, v.color, v.stock, p.id as product_id, p.name, p.price, p.images[1] as image
      into v_variant
      from product_variants v join products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid and p.is_active
       for update of v;

    if not found then raise exception 'An item in your bag is no longer available'; end if;
    if v_variant.stock < v_qty then
      raise exception '% (%) only has % left', v_variant.name, v_variant.size, v_variant.stock;
    end if;

    update product_variants set stock = stock - v_qty where product_variants.id = v_variant.id;

    insert into order_items (order_id, product_id, variant_id, product_name, size, color, image, unit_price, quantity)
    values (v_order.id, v_variant.product_id, v_variant.id, v_variant.name, v_variant.size, v_variant.color,
            v_variant.image, v_variant.price, v_qty);

    v_subtotal := v_subtotal + v_variant.price * v_qty;
  end loop;

  v_fee := case when v_settings.free_delivery_over is not null and v_subtotal >= v_settings.free_delivery_over
                then 0 else v_settings.delivery_fee end;

  update orders set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where orders.id = v_order.id;

  return query select v_order.id, v_order.order_number;
end;
$$;

grant execute on function place_order(jsonb, jsonb, payment_method, text) to anon, authenticated;

-- Order confirmation page: anyone holding the (unguessable) order id can see its summary.
create or replace function get_order(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', o.id, 'order_number', o.order_number, 'status', o.status,
    'payment_method', o.payment_method, 'payment_status', o.payment_status,
    'customer_name', o.customer_name, 'city', o.city,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name, 'size', i.size, 'color', i.color,
        'image', i.image, 'unit_price', i.unit_price, 'quantity', i.quantity))
      from order_items i where i.order_id = o.id), '[]'::jsonb))
  from orders o where o.id = p_id;
$$;

grant execute on function get_order(uuid) to anon, authenticated;

-- Cancelling an order puts its pieces back in stock.
create or replace function restock_cancelled_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update product_variants v set stock = v.stock + i.qty
      from (select variant_id, sum(quantity) as qty from order_items
             where order_id = new.id and variant_id is not null group by variant_id) i
     where i.variant_id = v.id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger orders_before_update before update on orders
for each row execute function restock_cancelled_order();

-- ─── Product photos ─────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product images admin insert" on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());
create policy "product images admin update" on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());
create policy "product images admin delete" on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());

-- ─── Starter categories ─────────────────────────────────────────────────────
insert into categories (name, slug, sort) values
  ('Suits', 'suits', 1),
  ('Blazers', 'blazers', 2),
  ('Shirts', 'shirts', 3),
  ('Trousers', 'trousers', 4),
  ('Outerwear', 'outerwear', 5),
  ('Knitwear', 'knitwear', 6),
  ('Dresses', 'dresses', 7),
  ('Shoes', 'shoes', 8),
  ('Accessories', 'accessories', 9);

-- Live order feed in the admin panel (RLS still applies: only admins receive rows).
alter publication supabase_realtime add table orders;
