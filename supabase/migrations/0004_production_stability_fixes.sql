create table if not exists public.skill_quiz_questions (id uuid primary key default extensions.uuid_generate_v4(), category_id uuid not null references public.categories(id), question text not null, options jsonb not null, correct_index integer not null check (correct_index >= 0));
alter table public.skill_quiz_questions enable row level security;
create index if not exists idx_skill_quiz_questions_category on public.skill_quiz_questions(category_id);
create unique index if not exists offers_one_pending_per_worker_job on public.offers(job_id,worker_id) where status='pending';
create index if not exists messages_job_created_at_idx on public.messages(job_id,created_at desc);
do $$ begin if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then execute 'alter publication supabase_realtime add table public.messages'; end if; end $$;