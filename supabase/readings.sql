create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) >= 10),
  present_energy text not null,
  path_a text not null,
  path_b text not null,
  hidden_influence text not null,
  reflection_question text not null,
  created_at timestamptz not null default now()
);

create index if not exists readings_user_created_at_idx
  on public.readings (user_id, created_at desc);

alter table public.readings enable row level security;

create policy "readings_select_own"
  on public.readings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "readings_insert_own"
  on public.readings
  for insert
  to authenticated
  with check (auth.uid() = user_id);
