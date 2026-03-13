# ur journ.

A day-trading journal built with React, TypeScript, and Vite.

## Features

- Log trades with date, symbol, side, setup, entry, exit, shares, fees, confidence, and notes
- Automatic P&L and return percentage calculation per trade
- Dashboard statistics:
  - Total trades
  - Net P&L
  - Win rate
  - Average winner and average loser
  - Profit factor
  - Best and worst trade
- Trade log table with delete action
- Export all logged trades to JSON
- Local persistence using browser localStorage

## Run Locally

```bash
npm install
npm run dev
```

### Supabase Environment

Create a `.env` file from `.env.example` and fill in your project values:

```bash
cp .env.example .env
```

Required variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vite will print a local URL, typically http://localhost:5173.

## Build

```bash
npm run build
```

## Data Storage

Trade records are synced to Supabase when configured and still cached locally as a fallback.

Local fallback key:

- pulse-journal-trades

### Supabase Schema

Run the SQL in [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor.

This creates:

- `profiles` table linked to `auth.users`
- `trades` table linked to authenticated users
- row-level security policies so each user only reads/writes their own rows

## Next Improvements

- Add CSV import/export
- Add filters by symbol, setup, and date range
- Add charting for equity curve and setup performance
