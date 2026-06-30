# Trade X

Trade X is a professional trading journal and AI chart-analysis platform designed to help traders review performance, analyze trade setups, and improve decision-making with clear dashboard insights.

## Features

- Login screen with demo account option
- Dashboard KPIs for trades, win rate, net profit, and risk/reward
- Empty dashboard state until trades are added
- Add Trade form with automatic profit/loss and risk/reward calculation
- Trade history with filters
- AI chart analyzer interface with Summary, Trade Plan, and Insights tabs
- Strategy and psychology tracking pages
- Backend-powered trade plan validation for AI chart analysis
- Black and gold theme matched to the Trade X logo

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Node.js and Express backend

## Run Locally

Install dependencies:

```bash
npm install
```

Start the full local app for development:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

Open:

```text
http://127.0.0.1:5173
```

The frontend uses `/api` and proxies requests to the backend during local development.

## Production / One Website URL

Trade X is configured as a full-stack app. After building, the Express backend serves:

- The complete frontend website
- All API routes under `/api`
- AI chart analysis from the same domain

Build and start:

```bash
npm run build
npm start
```

Open:

```text
http://127.0.0.1:5000
```

For deployment, use the included `render.yaml` on Render. Add `GROQ_API_KEY` as a secret environment variable in the hosting dashboard.

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

## Project Summary

Trade X combines trade journaling, performance tracking, and AI-assisted chart review in a modern dashboard experience. It is built for traders who want a simple way to record trades, evaluate risk/reward, review trade quality, and turn chart screenshots into structured analysis.

Environment files such as `.env` are ignored and should not be committed.
