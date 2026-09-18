-- 0001_initial_schema.sql
-- Reconstructed from the live "KAAM" Supabase project's current schema so
-- this repo reproduces it exactly. RLS is enabled on every table from this
-- migration (Rules.md #26). Money fields are *_cents (paisa, PKR).

create extension if not exists "uuid-ossp" schema extensions;

-- ── profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  address text,
  education text,
  occupation text,
  is_profile_complete boolean not null default false,
  is_verified boolean not null default false,
  is_admin boolean not null default false,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free','basic','elite')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_select_own_or_public_fields on public.profiles for select using (true);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- ── wallets ─────────────────────────────────────────────────────────────
create table public.wallets (
  user_id uuid primary key references public.profiles(id),
  balance_cents bigint not null default 0 check (balance_cents >= 0),
  currency text not null default 'PKR',
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;
create policy wallets_select_own_only on public.wallets for select using (auth.uid() = user_id);
-- No INSERT/UPDATE policy for regular users, by design (Rules.md #2) — all
-- balance changes go through adjust_wallet_balance / finalize_wallet_request.

-- ── payout_methods (added — see 0002) ─────────────────────────────────────
-- (kept separate, see 0002_create_payout_methods.sql)

-- ── categories ──────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null unique,
  is_creative boolean not null default false,
  min_completed_jobs_for_average integer not null default 10,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy categories_select_all on public.categories for select using (true);

insert into public.categories (name, is_creative) values
  ('Home Tutoring', false),
  ('Tutoring & Academic Help', false),
  ('Graphic Design', true),
  ('Web Design / UI-UX', true),
  ('Web Development / Programming', false),
  ('Content Writing / Copywriting', true),
  ('Video Editing', true),
  ('Photography', false),
  ('Translation', false),
  ('Data Entry', false),
  ('Virtual Assistance', false),
  ('Assignment / Thesis Formatting', false),
  ('Errands / Local Task Help', false);

-- ── category_average_rates ──────────────────────────────────────────────
create table public.category_average_rates (
  category_id uuid primary key references public.categories(id),
  average_price_cents bigint,
  completed_job_count integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.category_average_rates enable row level security;
create policy category_averages_select_all on public.category_average_rates for select using (true);

-- ── jobs ────────────────────────────────────────────────────────────────
create table public.jobs (
  id uuid primary key default extensions.uuid_generate_v4(),
  client_id uuid not null references public.profiles(id),
  worker_id uuid references public.profiles(id),
  category_id uuid not null references public.categories(id),
  title text not null,
  description text not null,
  payment_type text not null check (payment_type in ('cash','service','either')),
  price_min_cents bigint,
  price_max_cents bigint,
  acceptance_criteria jsonb not null default '[]'::jsonb,
  deadline timestamptz not null,
  status text not null default 'open'
    check (status in ('open','offer_pending','assigned','in_progress','submitted','completed','cancelled','disputed')),
  is_boosted boolean not null default false,
  pause_count integer not null default 0,
  auto_release_at timestamptz,
  custom_release_hours integer,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now()
);
alter table public.jobs enable row level security;
create policy jobs_select_open_or_party on public.jobs for select
  using (status = 'open' or auth.uid() = client_id or auth.uid() = worker_id);
create policy jobs_insert_own_as_client on public.jobs for insert with check (auth.uid() = client_id);
create policy jobs_update_party_only on public.jobs for update
  using (auth.uid() = client_id or auth.uid() = worker_id);

-- ── offers ──────────────────────────────────────────────────────────────
create table public.offers (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  worker_id uuid not null references public.profiles(id),
  offer_amount_cents bigint,
  offer_service_description text,
  worker_valuation_cents bigint,
  gap_confirmation_required boolean not null default false,
  client_confirmed_gap boolean not null default false,
  worker_confirmed_gap boolean not null default false,
  gap_confirmation_expires_at timestamptz,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at timestamptz not null default now()
);
alter table public.offers enable row level security;
create policy offers_select_job_parties on public.offers for select
  using (auth.uid() = worker_id or auth.uid() in (select client_id from public.jobs where id = offers.job_id));
create policy offers_insert_own_as_worker on public.offers for insert with check (auth.uid() = worker_id);
create policy offers_update_job_parties on public.offers for update
  using (auth.uid() = worker_id or auth.uid() in (select client_id from public.jobs where id = offers.job_id));

-- ── job_progress ────────────────────────────────────────────────────────
create table public.job_progress (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  author_id uuid not null references public.profiles(id),
  note text,
  percent_at_update integer not null check (percent_at_update between 0 and 100),
  created_at timestamptz not null default now()
);
alter table public.job_progress enable row level security;
create policy job_progress_select_job_parties on public.job_progress for select
  using (auth.uid() in (select client_id from public.jobs where id = job_progress.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = job_progress.job_id));
create policy job_progress_insert_job_parties on public.job_progress for insert
  with check (auth.uid() in (select client_id from public.jobs where id = job_progress.job_id)
           or auth.uid() in (select worker_id from public.jobs where id = job_progress.job_id));

-- ── job_milestones (optional client-initiated splitting, App.md §3.5) ──
create table public.job_milestones (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  sequence integer not null,
  amount_cents bigint not null,
  status text not null default 'pending' check (status in ('pending','escrowed','released')),
  created_at timestamptz not null default now()
);
alter table public.job_milestones enable row level security;
create policy job_milestones_select_job_parties on public.job_milestones for select
  using (auth.uid() in (select client_id from public.jobs where id = job_milestones.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = job_milestones.job_id));

-- ── messages ────────────────────────────────────────────────────────────
create table public.messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  sender_id uuid not null references public.profiles(id),
  content text not null,
  status text not null default 'safe' check (status in ('pending','safe','violation')),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy messages_select_job_parties on public.messages for select
  using (auth.uid() in (select client_id from public.jobs where id = messages.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = messages.job_id));
create policy messages_insert_job_parties on public.messages for insert
  with check (auth.uid() = sender_id
    and (auth.uid() in (select client_id from public.jobs where id = messages.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = messages.job_id)));

-- ── flagged_messages (service-role only — no public policies, by design) ─
create table public.flagged_messages (
  id uuid primary key default extensions.uuid_generate_v4(),
  message_id uuid not null references public.messages(id),
  reason text not null,
  status text not null default 'pending' check (status in ('pending','violation','safe')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.flagged_messages enable row level security;
-- Intentionally no policies: only accessed via service-role Edge Functions
-- (moderate-message), never directly by anon/authenticated roles.

-- ── ratings ─────────────────────────────────────────────────────────────
create table public.ratings (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  rater_id uuid not null references public.profiles(id),
  ratee_id uuid not null references public.profiles(id),
  stars integer not null check (stars between 1 and 5),
  comment text,
  proof_url text,
  is_removed boolean not null default false,
  removed_reason text,
  created_at timestamptz not null default now()
);
alter table public.ratings enable row level security;
create policy ratings_select_all_non_removed on public.ratings for select
  using (is_removed = false or auth.uid() = rater_id);
create policy ratings_insert_receiving_party_only on public.ratings for insert
  with check (auth.uid() = rater_id and auth.uid() <> ratee_id
    and (auth.uid() in (select client_id from public.jobs where id = ratings.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = ratings.job_id)));

-- ── disputes ────────────────────────────────────────────────────────────
create table public.disputes (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid not null references public.jobs(id),
  raised_by uuid not null references public.profiles(id),
  reason text not null,
  status text not null default 'open' check (status in ('open','admin_review','resolved')),
  resolution text,
  created_at timestamptz not null default now()
);
alter table public.disputes enable row level security;
create policy disputes_select_job_parties on public.disputes for select
  using (auth.uid() in (select client_id from public.jobs where id = disputes.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = disputes.job_id));
create policy disputes_insert_job_parties on public.disputes for insert
  with check (auth.uid() = raised_by
    and (auth.uid() in (select client_id from public.jobs where id = disputes.job_id)
      or auth.uid() in (select worker_id from public.jobs where id = disputes.job_id)));

-- ── penalties (service-role writes only; owner can read) ───────────────
create table public.penalties (
  id uuid primary key default extensions.uuid_generate_v4(),
  job_id uuid references public.jobs(id),
  user_id uuid not null references public.profiles(id),
  reason text not null,
  amount_cents bigint not null,
  created_at timestamptz not null default now()
);
alter table public.penalties enable row level security;
create policy penalties_select_own on public.penalties for select using (auth.uid() = user_id);

-- ── subscriptions ───────────────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  tier text not null check (tier in ('free','basic','elite')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true
);
alter table public.subscriptions enable row level security;
create policy subscriptions_select_own on public.subscriptions for select using (auth.uid() = user_id);

-- ── referrals ───────────────────────────────────────────────────────────
create table public.referrals (
  id uuid primary key default extensions.uuid_generate_v4(),
  referrer_id uuid not null references public.profiles(id),
  referred_id uuid not null unique references public.profiles(id),
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
create policy referrals_select_own on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- ── wallet_transactions (service-role writes only; owner can read) ─────
create table public.wallet_transactions (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  type text not null check (type in ('deposit','withdrawal','job_payment','job_payout','penalty','subscription','boost','verification','refund')),
  amount_cents bigint not null,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  reference_job_id uuid references public.jobs(id),
  proof_url text,
  created_at timestamptz not null default now()
);
alter table public.wallet_transactions enable row level security;
create policy wallet_transactions_select_own on public.wallet_transactions for select using (auth.uid() = user_id);
-- No INSERT policy for regular users — see wallet-requests Edge Function.

-- ── skill_verifications ─────────────────────────────────────────────────
create table public.skill_verifications (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid not null references public.profiles(id),
  category_id uuid not null references public.categories(id),
  passed boolean not null default false,
  score integer,
  attempted_at timestamptz not null default now()
);
alter table public.skill_verifications enable row level security;
create policy skill_verifications_select_own_or_public on public.skill_verifications for select using (true);
create policy skill_verifications_insert_own on public.skill_verifications for insert with check (auth.uid() = user_id);

-- ── storage buckets ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('deposit-proofs', 'deposit-proofs', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('rating-proofs', 'rating-proofs', false)
  on conflict (id) do nothing;
