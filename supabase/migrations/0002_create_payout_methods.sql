-- Payout methods: no payment processor sits between the user and their bank
-- (explicit product decision), so the real bank account/IBAN has to be
-- stored to send a withdrawal to it. Locked to owner + admin only. This is
-- the one deliberate exception to "never store account numbers" — scoped to
-- beneficiary bank info, never to card/CVV data.
create table if not exists public.payout_methods (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bank_name text not null,
  account_title text not null,
  account_number text not null,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.payout_methods enable row level security;

create policy "owner can manage own payout methods"
  on public.payout_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.profiles add column if not exists is_admin boolean not null default false;

create policy "admins can read payout methods"
  on public.payout_methods for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
