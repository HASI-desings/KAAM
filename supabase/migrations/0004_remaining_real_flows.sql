-- 0004_remaining_real_flows.sql
-- Restores the backend pieces referenced by the frontend/API layer.
-- This migration is intentionally additive and idempotent.

alter table public.jobs
  add column if not exists escrow_amount_cents bigint not null default 0;

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists profiles_referral_code_uidx
  on public.profiles(referral_code)
  where referral_code is not null;

create table if not exists public.quiz_questions (
  id uuid primary key default extensions.uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option integer not null,
  created_at timestamptz not null default now()
);
alter table public.quiz_questions enable row level security;
drop policy if exists quiz_questions_select_authenticated on public.quiz_questions;
create policy quiz_questions_select_authenticated on public.quiz_questions
  for select using (auth.uid() is not null);

create index if not exists quiz_questions_category_idx
  on public.quiz_questions(category_id);

-- Keep the referral code available for existing users without exposing
-- an admin-only mutation path.
create or replace function public.ensure_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.referral_code is null or btrim(new.referral_code) = '' then
    new.referral_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_ensure_referral_code on public.profiles;
create trigger profiles_ensure_referral_code
before insert or update of referral_code on public.profiles
for each row execute function public.ensure_referral_code();

update public.profiles
set referral_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
where referral_code is null;

-- Automation helper used by pg_cron when the extension is available.
create or replace function public.process_kaam_job_automation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  j record;
  payout bigint;
begin
  for j in
    select jobs.*
    from public.jobs
    where jobs.status = 'submitted'
      and jobs.auto_release_at is not null
      and jobs.auto_release_at <= now()
      and jobs.worker_id is not null
    for update skip locked
  loop
    select offer_amount_cents into payout
    from public.offers
    where job_id = j.id and status = 'accepted'
    order by created_at desc
    limit 1;

    if coalesce(payout, 0) > 0 then
      perform public.adjust_wallet_balance(
        j.worker_id, payout, 'job_payout', j.id, null, 'completed'
      );
      update public.jobs
      set status = 'completed', progress_percent = 100
      where id = j.id and status = 'submitted';
    end if;
  end loop;
end;
$$;

revoke execute on function public.process_kaam_job_automation() from public, anon, authenticated;
grant execute on function public.process_kaam_job_automation() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'kaam-job-automation';
    perform cron.schedule(
      'kaam-job-automation',
      '*/15 * * * *',
      $$select public.process_kaam_job_automation();$$
    );
  end if;
exception when undefined_table then
  null;
end;
$$;
