alter table public.gemini_cards
  add column if not exists product_slug text not null default 'gemini-pro-12-months';

create index if not exists gemini_cards_product_status_created_at_idx
  on public.gemini_cards (product_slug, status, created_at);

create or replace function public.claim_membership_card(p_product_slug text)
returns table (code text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with selected_card as (
    select id
    from public.gemini_cards
    where product_slug = p_product_slug
      and status = 'available'
    order by created_at, id
    for update skip locked
    limit 1
  )
  update public.gemini_cards cards
  set
    status = 'sold',
    claim_token = gen_random_uuid(),
    sold_at = now()
  from selected_card
  where cards.id = selected_card.id
  returning cards.code;
end;
$$;

create or replace function public.claim_gemini_card()
returns table (code text)
language sql
security definer
set search_path = public
as $$
  select * from public.claim_membership_card('gemini-pro-12-months');
$$;

revoke all on function public.claim_membership_card(text) from public;
revoke execute on function public.claim_membership_card(text) from anon;
revoke execute on function public.claim_membership_card(text) from authenticated;
grant execute on function public.claim_membership_card(text) to service_role;

revoke all on function public.claim_gemini_card() from public;
revoke execute on function public.claim_gemini_card() from anon;
revoke execute on function public.claim_gemini_card() from authenticated;
grant execute on function public.claim_gemini_card() to service_role;

insert into public.gemini_cards (product_slug, code, status) values
  ('chatgpt-plus-monthly', 'AIDES1VUPZSBNOUMPL5E3RCX2A4VZW29', 'available')
on conflict (code) do nothing;
