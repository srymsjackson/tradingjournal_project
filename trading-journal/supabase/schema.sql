-- Enable UUID generation helpers.
create extension if not exists pgcrypto;

-- =========================================================
-- Utility: updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Basic public profile linked 1:1 with authenticated user.
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================================================
-- Trigger keeps profiles + preferences in sync for new users.
-- =========================================================
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- =========================================================
-- User-scoped trades table.
-- =========================================================
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  trade_date date not null,
  symbol text not null,
  side text not null check (side in ('LONG', 'SHORT')),

  entry_price numeric(18,8) not null,
  exit_price numeric(18,8) not null,
  quantity numeric(18,8) not null,

  fees numeric(18,8) not null default 0,
  setup text not null default '',
  session text not null default '',
  notes text not null default '',
  duration_seconds integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  gross_pnl numeric(18,8) generated always as (
    case
      when side = 'LONG' then (exit_price - entry_price) * quantity
      when side = 'SHORT' then (entry_price - exit_price) * quantity
      else 0
    end
  ) stored,

  net_pnl numeric(18,8) generated always as (
    case
      when side = 'LONG' then ((exit_price - entry_price) * quantity) - fees
      when side = 'SHORT' then ((entry_price - exit_price) * quantity) - fees
      else 0
    end
  ) stored,

  constraint trades_symbol_not_blank check (btrim(symbol) <> ''),
  constraint trades_entry_price_positive check (entry_price > 0),
  constraint trades_exit_price_positive check (exit_price > 0),
  constraint trades_quantity_positive check (quantity > 0),
  constraint trades_fees_nonnegative check (fees >= 0),
  constraint trades_duration_nonnegative check (duration_seconds >= 0)
);

create index if not exists idx_trades_user_created_at
  on public.trades(user_id, created_at desc);

create index if not exists idx_trades_user_trade_date
  on public.trades(user_id, trade_date desc);

create index if not exists idx_trades_user_symbol
  on public.trades(user_id, symbol);

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

drop trigger if exists trg_trades_updated_at on public.trades;
create trigger trg_trades_updated_at
before update on public.trades
for each row
execute function public.set_updated_at();

-- =========================================================
-- User-scoped settings/preferences.
-- =========================================================
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trading_preferences jsonb not null default '{}'::jsonb,
  favorite_symbols jsonb not null default '[]'::jsonb,
  theme_mode text not null default 'dark',
  accent_color text not null default '#3a86a8',
  session_tracking jsonb not null default '{"asia": true, "london": true, "newYork": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_preferences_theme_mode_check
    check (theme_mode in ('dark', 'light', 'system')),

  constraint user_preferences_accent_color_hex_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),

  constraint user_preferences_favorite_symbols_is_array
    check (jsonb_typeof(favorite_symbols) = 'array'),

  constraint user_preferences_trading_preferences_is_object
    check (jsonb_typeof(trading_preferences) = 'object'),

  constraint user_preferences_session_tracking_is_object
    check (jsonb_typeof(session_tracking) = 'object')
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

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

-- =========================================================
-- Deletes the currently authenticated user account.
-- =========================================================
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