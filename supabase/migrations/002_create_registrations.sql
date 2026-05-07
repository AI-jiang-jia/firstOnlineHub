create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  source text not null default 'web_register_form',
  form_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(auth_user_id)
);

create index if not exists registrations_email_idx on public.registrations (lower(email));
create index if not exists registrations_created_at_idx on public.registrations (created_at desc);

alter table public.registrations enable row level security;

drop policy if exists "Admins can read registrations" on public.registrations;
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    create policy "Admins can read registrations"
    on public.registrations
    for select
    using (public.is_admin());
  end if;
end $$;

drop policy if exists "Service role manages registrations" on public.registrations;
create policy "Service role manages registrations"
on public.registrations
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
