# Your Oracle

A minimal mystical decision-guidance app built with Next.js + Supabase.

## Features implemented

- Supabase email magic-link login
- Ask question and generate structured oracle reading:
  - Present Energy
  - Path A
  - Path B
  - Hidden Influence
  - Reflection Question
- Reading saved in Supabase database
- History page with previous readings
- Daily limit: **3 free readings per user per day**
- Safety language + entertainment-only disclaimer shown in app
- Single clear oracle reply card (simple Tinder-style UI)
- Random separate clarification screen every few readings
- AI detects yes/no-style questions and can return a direct YES/NO lead

## 1) Supabase setup (exact SQL)

Run this SQL in Supabase SQL Editor:

```sql
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
```

Same SQL is also saved in `supabase/readings.sql`.

## 2) Environment variables

Copy and fill env values:

```bash
cp .env.example .env.local
```

Required values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional (recommended for AI-generated readings):

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
ORACLE_AI_MODEL=gpt-4.1-mini
```

## 3) Supabase Auth URL configuration

In Supabase dashboard:

- Authentication -> URL Configuration -> Site URL:
  - `http://localhost:3000`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`

## 4) Run locally

If Node is already installed on your machine:

```bash
npm install
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## 5) End-to-end test flow

1. Go to `/login` and enter your email.
2. Open the magic link from your inbox.
3. You should land on `/oracle`.
4. Enter a question and click **Ask the Oracle**.
5. Confirm you see a structured reading with 5 sections + disclaimer.
6. Click **View History** and confirm that reading appears in the list.
7. Go back to `/oracle` and ask 2 more questions (total 3 today).
8. Try a 4th question the same day:
   - You should get a daily limit message.
   - Ask button becomes disabled when remaining reaches 0.

## Notes

- Daily limit is currently calculated by UTC day boundaries.
- If `OPENAI_API_KEY` is present, readings are AI-generated.
- If OpenAI is unavailable, the app falls back to local template generation.
