-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists public.todos (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists todos_user_id_idx on public.todos (user_id);

-- 행 단위 보안(RLS): 각 사용자는 자기 할 일만 보고 수정할 수 있습니다.
alter table public.todos enable row level security;

drop policy if exists "own todos select" on public.todos;
drop policy if exists "own todos insert" on public.todos;
drop policy if exists "own todos update" on public.todos;
drop policy if exists "own todos delete" on public.todos;

create policy "own todos select" on public.todos
  for select to authenticated using (user_id = auth.uid());
create policy "own todos insert" on public.todos
  for insert to authenticated with check (user_id = auth.uid());
create policy "own todos update" on public.todos
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own todos delete" on public.todos
  for delete to authenticated using (user_id = auth.uid());
