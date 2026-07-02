# Trade X

Trade X is a trading journal and AI chart-analysis platform. Traders can record trades, review performance, track psychology, and upload chart screenshots for a structured Gemini-powered trade plan.

## Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- AI provider: Gemini API
- Frontend hosting: GitHub Pages
- Backend hosting: Render

## Project Structure

```text
frontend/
  React + Vite website
backend/
  Express API for auth, trades, and AI chart analysis
render.yaml
  Render blueprint for the backend service
```

This repository currently uses `frontend/` and `backend/`. If frontend and backend are split into separate GitHub repositories later, keep the same commands inside each repository.

## Local Development

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create backend environment file:

```bash
cp backend/.env.example backend/.env
```

Set:

```text
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=any_long_random_value
```

3. Create frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

For local development:

```text
VITE_API_URL=http://127.0.0.1:5000/api
```

4. Start both apps:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

Open the frontend at:

```text
http://127.0.0.1:5173
```

Backend health check:

```text
http://127.0.0.1:5000/health
```

## Production Deployment

### Backend on Render

Create a new Render Web Service for the backend.

Render settings:

```text
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
Health Check Path: /health
```

Required environment variables:

```text
NODE_ENV=production
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=generate_a_long_random_secret
FRONTEND_ORIGIN=https://dev-ali-hassan.github.io
```

Optional environment variables:

```text
GEMINI_MODEL=gemini-1.5-flash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

After Render deploys, copy the backend URL. It will look like:

```text
https://your-render-service.onrender.com
```

The API base URL for the frontend must include `/api`:

```text
https://your-render-service.onrender.com/api
```

### Frontend on GitHub Pages

Set this GitHub repository variable before deploying the frontend:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

The GitHub Actions workflow builds the frontend for GitHub Pages and injects `VITE_API_URL`.

Frontend URL:

```text
https://dev-ali-hassan.github.io/Trade-X/
```

## Environment Variables

Backend:

```text
GEMINI_API_KEY
GEMINI_MODEL
JWT_SECRET
FRONTEND_ORIGIN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PORT
NODE_ENV
```

Frontend:

```text
VITE_API_URL
```

Never commit `.env` files. Only `.env.example` files are safe to commit.

## Production Notes

- The backend listens on `process.env.PORT`, which Render provides automatically.
- The backend exposes `GET /health` and `GET /api/health`.
- CORS allows the GitHub Pages origin and local development origins.
- Uploaded chart images are validated by file type and size.
- Gemini API errors, missing keys, invalid uploads, backend downtime, and timeouts return user-friendly messages.
