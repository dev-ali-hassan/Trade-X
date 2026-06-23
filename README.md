# Trade X

Trade X is a dark trading journal dashboard with AI chart-analysis UI, local login/demo mode, trade tracking, performance insights, and chart upload flow.

## Features

- Login screen with demo account option
- Dashboard KPIs for trades, win rate, net profit, and risk/reward
- Empty dashboard state until trades are added
- Add Trade form with automatic profit/loss and risk/reward calculation
- Trade history with filters
- AI chart analyzer interface with Summary, Trade Plan, and Insights tabs
- Strategy and psychology tracking pages
- Local browser-based data storage, no database required
- Black and gold theme matched to the Trade X logo

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Node.js and Express backend scaffold

## Run Locally

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev --workspace frontend
```

Open:

```text
http://127.0.0.1:5173
```

Optional backend:

```bash
npm run dev --workspace backend
```

## Project Structure

```text
frontend/
  src/
    components/
    data/
    lib/
    pages/
backend/
  src/
    routes/
    services/
    middleware/
```

## Notes

- The app works without a database.
- User sessions and trades are kept in the browser for this version.
- Environment files such as `.env` are ignored and should not be committed.
