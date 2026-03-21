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
  trade_date date not null default current_date,
  market text not null default '',
  account text not null default '',
  side text not null check (side in ('LONG', 'SHORT')),
  setup_type text not null default '',
  session text not null default '',
  entry_price numeric(18,6) not null default 0,
  exit_price numeric(18,6) not null default 0,
  stop_loss numeric(18,6) not null default 0,
  take_profit numeric(18,6) not null default 0,
  quantity numeric(18,6) not null default 0,
  risk_amount numeric(18,6) not null default 0,
  pnl numeric(18,6) not null default 0,
  r_multiple numeric(18,6) not null default 0,
  screenshot_before text not null default '',
  screenshot_after text not null default '',
  notes text not null default '',
  liquidity_sweep_present boolean not null default false,
  displacement_present boolean not null default false,
  mss_present boolean not null default false,
  fvg_present boolean not null default false,
  htf_bias_aligned boolean not null default false,
  news_risk_checked boolean not null default false,
  a_plus_setup boolean not null default false,
  planned_before_entry boolean not null default false,
  followed_plan boolean not null default false,
  execution_rating integer not null default 5 check (execution_rating between 1 and 10),
  emotional_state text not null default '',
  mistake_tags text[] not null default '{}',
  reason_for_exit text not null default '',
  would_take_again boolean not null default true,
  fees numeric(18,6) not null default 0,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trades add column if not exists trade_date date;
alter table public.trades add column if not exists date date;
alter table public.trades add column if not exists market text;
alter table public.trades add column if not exists symbol text;
alter table public.trades add column if not exists account text;
alter table public.trades add column if not exists setup_type text;
alter table public.trades add column if not exists setup text;
alter table public.trades add column if not exists entry_price numeric(18,6);
alter table public.trades add column if not exists entry numeric(18,6);
alter table public.trades add column if not exists exit_price numeric(18,6);
alter table public.trades add column if not exists exit numeric(18,6);
alter table public.trades add column if not exists stop_loss numeric(18,6);
alter table public.trades add column if not exists take_profit numeric(18,6);
alter table public.trades add column if not exists quantity numeric(18,6);
alter table public.trades add column if not exists shares numeric(18,6);
alter table public.trades add column if not exists risk_amount numeric(18,6);
alter table public.trades add column if not exists r_multiple numeric(18,6);
alter table public.trades add column if not exists screenshot_before text;
alter table public.trades add column if not exists screenshot_after text;
alter table public.trades add column if not exists liquidity_sweep_present boolean;
alter table public.trades add column if not exists displacement_present boolean;
alter table public.trades add column if not exists mss_present boolean;
alter table public.trades add column if not exists fvg_present boolean;
alter table public.trades add column if not exists htf_bias_aligned boolean;
alter table public.trades add column if not exists news_risk_checked boolean;
alter table public.trades add column if not exists a_plus_setup boolean;
alter table public.trades add column if not exists planned_before_entry boolean;
alter table public.trades add column if not exists followed_plan boolean;
alter table public.trades add column if not exists execution_rating integer;
alter table public.trades add column if not exists emotional_state text;
alter table public.trades add column if not exists mistake_tags text[];
alter table public.trades add column if not exists reason_for_exit text;
alter table public.trades add column if not exists would_take_again boolean;
alter table public.trades add column if not exists updated_at timestamptz;

update public.trades set trade_date = coalesce(trade_date, date, current_date);
update public.trades set market = coalesce(nullif(market, ''), symbol, '');
update public.trades set account = coalesce(account, '');
update public.trades set setup_type = coalesce(nullif(setup_type, ''), setup, '');
update public.trades set entry_price = coalesce(entry_price, entry, 0);
update public.trades set exit_price = coalesce(exit_price, exit, 0);
update public.trades set quantity = coalesce(quantity, shares, 0);
update public.trades set risk_amount = coalesce(risk_amount, 0);
update public.trades set r_multiple = coalesce(r_multiple, 0);
update public.trades set stop_loss = coalesce(stop_loss, 0);
update public.trades set take_profit = coalesce(take_profit, 0);
update public.trades set screenshot_before = coalesce(screenshot_before, '');
update public.trades set screenshot_after = coalesce(screenshot_after, '');
update public.trades set liquidity_sweep_present = coalesce(liquidity_sweep_present, false);
update public.trades set displacement_present = coalesce(displacement_present, false);
update public.trades set mss_present = coalesce(mss_present, false);
update public.trades set fvg_present = coalesce(fvg_present, false);
update public.trades set htf_bias_aligned = coalesce(htf_bias_aligned, false);
update public.trades set news_risk_checked = coalesce(news_risk_checked, false);
update public.trades set a_plus_setup = coalesce(a_plus_setup, false);
update public.trades set planned_before_entry = coalesce(planned_before_entry, false);
update public.trades set followed_plan = coalesce(followed_plan, false);
update public.trades set execution_rating = coalesce(execution_rating, 5);
update public.trades set emotional_state = coalesce(emotional_state, '');
update public.trades set mistake_tags = coalesce(mistake_tags, '{}');
update public.trades set reason_for_exit = coalesce(reason_for_exit, '');
update public.trades set would_take_again = coalesce(would_take_again, true);
update public.trades set updated_at = coalesce(updated_at, created_at, now());

alter table public.trades alter column trade_date set not null;
alter table public.trades alter column market set not null;
alter table public.trades alter column account set not null;
alter table public.trades alter column setup_type set not null;
alter table public.trades alter column entry_price set not null;
alter table public.trades alter column exit_price set not null;
alter table public.trades alter column stop_loss set not null;
alter table public.trades alter column take_profit set not null;
alter table public.trades alter column quantity set not null;
alter table public.trades alter column risk_amount set not null;
alter table public.trades alter column r_multiple set not null;
alter table public.trades alter column screenshot_before set not null;
alter table public.trades alter column screenshot_after set not null;
alter table public.trades alter column liquidity_sweep_present set not null;
alter table public.trades alter column displacement_present set not null;
alter table public.trades alter column mss_present set not null;
alter table public.trades alter column fvg_present set not null;
alter table public.trades alter column htf_bias_aligned set not null;
alter table public.trades alter column news_risk_checked set not null;
alter table public.trades alter column a_plus_setup set not null;
alter table public.trades alter column planned_before_entry set not null;
alter table public.trades alter column followed_plan set not null;
alter table public.trades alter column execution_rating set not null;
alter table public.trades alter column emotional_state set not null;
alter table public.trades alter column mistake_tags set not null;
alter table public.trades alter column reason_for_exit set not null;
alter table public.trades alter column would_take_again set not null;
alter table public.trades alter column updated_at set not null;

alter table public.trades alter column trade_date set default current_date;
alter table public.trades alter column market set default '';
alter table public.trades alter column account set default '';
alter table public.trades alter column setup_type set default '';
alter table public.trades alter column entry_price set default 0;
alter table public.trades alter column exit_price set default 0;
alter table public.trades alter column stop_loss set default 0;
alter table public.trades alter column take_profit set default 0;
alter table public.trades alter column quantity set default 0;
alter table public.trades alter column risk_amount set default 0;
alter table public.trades alter column r_multiple set default 0;
alter table public.trades alter column screenshot_before set default '';
alter table public.trades alter column screenshot_after set default '';
alter table public.trades alter column liquidity_sweep_present set default false;
alter table public.trades alter column displacement_present set default false;
alter table public.trades alter column mss_present set default false;
alter table public.trades alter column fvg_present set default false;
alter table public.trades alter column htf_bias_aligned set default false;
alter table public.trades alter column news_risk_checked set default false;
alter table public.trades alter column a_plus_setup set default false;
alter table public.trades alter column planned_before_entry set default false;
alter table public.trades alter column followed_plan set default false;
alter table public.trades alter column execution_rating set default 5;
alter table public.trades alter column emotional_state set default '';
alter table public.trades alter column mistake_tags set default '{}';
alter table public.trades alter column reason_for_exit set default '';
alter table public.trades alter column would_take_again set default true;
alter table public.trades alter column updated_at set default now();

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

-- User-scoped prop account tracker.
create table if not exists public.prop_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_name text not null,
  firm text not null,
  account_size numeric(18,6) not null,
  starting_balance numeric(18,6) not null,
  current_balance numeric(18,6) not null,
  trailing_drawdown_type text not null,
  max_drawdown numeric(18,6) not null,
  daily_loss_limit numeric(18,6) not null,
  profit_target numeric(18,6) not null,
  min_payout_days integer not null,
  payout_profit_day_threshold numeric(18,6) not null,
  payout_days_completed integer not null default 0,
  status text not null check (status in ('ACTIVE', 'PAUSED', 'PASSED', 'FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prop_accounts_user_created_at on public.prop_accounts(user_id, created_at desc);

alter table public.prop_accounts enable row level security;

drop policy if exists "prop_accounts_select_own" on public.prop_accounts;
create policy "prop_accounts_select_own"
  on public.prop_accounts for select
  using (auth.uid() = user_id);

drop policy if exists "prop_accounts_insert_own" on public.prop_accounts;
create policy "prop_accounts_insert_own"
  on public.prop_accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "prop_accounts_update_own" on public.prop_accounts;
create policy "prop_accounts_update_own"
  on public.prop_accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "prop_accounts_delete_own" on public.prop_accounts;
create policy "prop_accounts_delete_own"
  on public.prop_accounts for delete
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
