-- Run this in Supabase SQL editor
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text default 'Personal',
  progress integer default 0,
  due_date date,
  completed boolean default false,
  media jsonb,
  created_at timestamptz default now()
);

alter table public.goals enable row level security;

create policy if not exists "Users can read own goals"
on public.goals for select
using (auth.uid() = user_id);

create policy if not exists "Users can insert own goals"
on public.goals for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update own goals"
on public.goals for update
using (auth.uid() = user_id);

create policy if not exists "Users can delete own goals"
on public.goals for delete
using (auth.uid() = user_id);
