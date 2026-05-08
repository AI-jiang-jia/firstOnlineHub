create table if not exists public.payment_orders (
  order_no text primary key,
  product_slug text not null,
  product_name text not null,
  amount numeric(10,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'cancelled')),
  card_code text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz
);

create index if not exists payment_orders_status_created_at_idx
  on public.payment_orders (status, created_at);

create index if not exists payment_orders_product_status_idx
  on public.payment_orders (product_slug, status);

alter table public.payment_orders enable row level security;

create or replace function public.fulfill_paid_membership_order(p_order_no text)
returns table (result text, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  order_row public.payment_orders%rowtype;
  selected_card record;
begin
  select *
  into order_row
  from public.payment_orders
  where order_no = p_order_no
  for update;

  if not found then
    return query select 'order_not_found'::text, null::text;
    return;
  end if;

  if order_row.status = 'fulfilled' and order_row.card_code is not null then
    return query select 'already_fulfilled'::text, order_row.card_code;
    return;
  end if;

  if order_row.status <> 'paid' then
    return query select 'not_paid'::text, null::text;
    return;
  end if;

  select id, gemini_cards.code
  into selected_card
  from public.gemini_cards
  where product_slug = order_row.product_slug
    and status = 'available'
  order by created_at, id
  for update skip locked
  limit 1;

  if not found then
    return query select 'sold_out'::text, null::text;
    return;
  end if;

  update public.gemini_cards
  set
    status = 'sold',
    claim_token = gen_random_uuid(),
    sold_at = now()
  where id = selected_card.id;

  update public.payment_orders
  set
    status = 'fulfilled',
    card_code = selected_card.code,
    fulfilled_at = now()
  where order_no = p_order_no;

  return query select 'success'::text, selected_card.code;
end;
$$;

revoke all on function public.fulfill_paid_membership_order(text) from public;
revoke execute on function public.fulfill_paid_membership_order(text) from anon;
revoke execute on function public.fulfill_paid_membership_order(text) from authenticated;
grant execute on function public.fulfill_paid_membership_order(text) to service_role;
