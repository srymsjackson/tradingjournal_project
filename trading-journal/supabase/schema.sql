-- Enable UUID generation helpers.
create extension if not exists pgcrypto;

-- Basic public profile linked 1:1 with authenticated user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger keeps profiles in sync for newly registered users.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- User-scoped trades table.
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  symbol text not null,
  side text not null check (side in ('LONG', 'SHORT')),
  entry numeric(18,6) not null,
  exit numeric(18,6) not null,
  shares numeric(18,6) not null,
  pnl numeric(18,6) not null,
  fees numeric(18,6) not null default 0,
  setup text not null,
  session text not null,
  notes text not null default '',
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_trades_user_created_at on public.trades(user_id, created_at desc);

alter table public.trades enable row level security;

drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own"
  on public.trades for select
  using (auth.uid() = user_id);

drop policy if exists "trades_insert_own" on public.trades;
create policy "trades_insert_own"
  on public.trades for insert
  with check (auth.uid() = user_id);

drop policy if exists "trades_update_own" on public.trades;
create policy "trades_update_own"
  on public.trades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_delete_own"
  on public.trades for delete
  using (auth.uid() = user_id);

-- User-scoped settings/preferences.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trading_preferences jsonb not null default '{}'::jsonb,
  favorite_symbols jsonb not null default '[]'::jsonb,
  theme_mode text not null default 'dark',
  accent_color text not null default '#3a86a8',
  session_tracking jsonb not null default '{"asia": true, "london": true, "newYork": true}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "preferences_select_own" on public.user_preferences;
create policy "preferences_select_own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "preferences_insert_own" on public.user_preferences;
create policy "preferences_insert_own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "preferences_update_own" on public.user_preferences;
create policy "preferences_update_own"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "preferences_delete_own" on public.user_preferences;
create policy "preferences_delete_own"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Deletes the currently authenticated user account.
-- Must be created by a role with privileges on auth.users.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
