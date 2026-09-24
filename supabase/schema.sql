-- Supabase 대시보드 > SQL Editor 에서 한 번 실행하세요.
-- 여러 번 실행해도 안전하며, 기존 bookmarks 테이블/데이터가 있으면 유지한 채 필요한 컬럼만 추가합니다.

-- ---------- folders ----------
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

-- ---------- bookmarks ----------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url text not null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks alter column user_id set default auth.uid();
alter table public.bookmarks add column if not exists folder_id uuid references public.folders (id) on delete set null;
alter table public.bookmarks add column if not exists description text;
alter table public.bookmarks add column if not exists is_favorite boolean not null default false;

-- tags 컬럼을 text[] 로 맞춤 (없으면 생성, text/json 이면 변환)
do $$
declare
  t text;
begin
  select data_type into t
  from information_schema.columns
  where table_schema = 'public' and table_name = 'bookmarks' and column_name = 'tags';

  if t is null then
    alter table public.bookmarks add column tags text[] not null default '{}';
  elsif t <> 'ARRAY' then
    alter table public.bookmarks add column tags_new text[] not null default '{}';
    if t in ('json', 'jsonb') then
      update public.bookmarks
      set tags_new = array(select jsonb_array_elements_text(tags::jsonb))
      where tags is not null and jsonb_typeof(tags::jsonb) = 'array';
    else
      -- 쉼표 구분 문자열로 간주
      update public.bookmarks
      set tags_new = array(
        select trim(x) from unnest(string_to_array(tags::text, ',')) as x where trim(x) <> ''
      )
      where tags is not null;
    end if;
    alter table public.bookmarks drop column tags;
    alter table public.bookmarks rename column tags_new to tags;
  else
    update public.bookmarks set tags = '{}' where tags is null;
    alter table public.bookmarks alter column tags set default '{}';
    alter table public.bookmarks alter column tags set not null;
  end if;
end $$;

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_tags_idx on public.bookmarks using gin (tags);
create index if not exists folders_user_id_idx on public.folders (user_id);

-- ---------- RLS: 본인 데이터만 접근 ----------
alter table public.folders enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "folders_owner" on public.folders;
create policy "folders_owner" on public.folders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "bookmarks_owner" on public.bookmarks;
create policy "bookmarks_owner" on public.bookmarks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 참고: 기존 bookmarks 테이블에 "모두 허용" 같은 다른 정책이 있다면 다른 사용자 데이터가 보일 수 있습니다.
-- 아래 쿼리로 확인 후 불필요한 정책은 drop policy 로 제거하세요.
-- select policyname, roles, cmd, qual from pg_policies where tablename = 'bookmarks';
