-- Recommendations: style tags on products + "bought together" from real orders.
-- Run after 0001_store.sql.

-- Style tags, picked in the admin product editor (see STYLES in src/lib/taste.ts).
alter table products add column if not exists styles text[] not null default '{}';
create index if not exists products_styles_idx on products using gin (styles);

-- Products most often bought in the same order as p_product_id (cancelled orders ignored).
-- Returns ids only, so no customer data leaves the database.
create or replace function bought_together(p_product_id uuid, p_limit int default 8)
returns table (product_id uuid, orders bigint)
language sql stable security definer set search_path = public as $$
  select other.product_id, count(distinct other.order_id) as orders
    from order_items mine
    join order_items other on other.order_id = mine.order_id and other.product_id <> mine.product_id
    join orders o on o.id = mine.order_id and o.status <> 'cancelled'
    join products p on p.id = other.product_id and p.is_active
   where mine.product_id = p_product_id
   group by other.product_id
   order by orders desc
   limit least(greatest(p_limit, 1), 24);
$$;

grant execute on function bought_together(uuid, int) to anon, authenticated;

create index if not exists order_items_product_idx on order_items (product_id);
