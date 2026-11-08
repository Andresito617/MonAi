-- Ejecuta este script una sola vez en Supabase > SQL Editor.
create table if not exists public.monai_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.monai_user_data enable row level security;

revoke all on table public.monai_user_data from anon, authenticated;
grant select, insert, update on table public.monai_user_data to authenticated;

drop policy if exists "Read own MonAi data" on public.monai_user_data;
create policy "Read own MonAi data"
  on public.monai_user_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Insert own MonAi data" on public.monai_user_data;
create policy "Insert own MonAi data"
  on public.monai_user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Update own MonAi data" on public.monai_user_data;
create policy "Update own MonAi data"
  on public.monai_user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
