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

Vite will print a local URL, typically http://localhost:5173.

## Build

```bash
npm run build
```

## Data Storage

Trade records are stored in localStorage under this key:

- pulse-journal-trades

## Next Improvements

- Add CSV import/export
- Add filters by symbol, setup, and date range
- Add charting for equity curve and setup performance
