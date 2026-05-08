create table if not exists public.gemini_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'available' check (status in ('available', 'sold')),
  claim_token uuid,
  sold_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gemini_cards_status_created_at_idx
  on public.gemini_cards (status, created_at);

alter table public.gemini_cards enable row level security;

create or replace function public.claim_gemini_card()
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
    where status = 'available'
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

revoke all on function public.claim_gemini_card() from public;
revoke execute on function public.claim_gemini_card() from anon;
revoke execute on function public.claim_gemini_card() from authenticated;
grant execute on function public.claim_gemini_card() to service_role;

insert into public.gemini_cards (code, status) values
  ('CL-T74BDXWGS5WSD3PY', 'available'),
  ('CL-A2Q0O2LCWU0YC4IS', 'available')
on conflict (code) do nothing;
