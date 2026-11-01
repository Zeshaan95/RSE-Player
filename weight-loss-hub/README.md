# Weight-loss Hub

A personal, offline-first web app for my fat-loss plan. It covers weigh-ins, gym sessions with a rest timer and progression hints, Sunday check-ins with adjustment advice, daily habits, a 3-day food audit and progress charts. All data stays on the device (IndexedDB). See `CLAUDE.md` for the plan and the code conventions. Every plan number is in `src/plan.ts`.

## Run locally

```bash
cd weight-loss-hub
npm install
npm test
npm run dev
```

## Deploy (free static hosting)

### Netlify

1. Push this repo to GitHub.
2. In Netlify, go to **Add new site → Import an existing project** and pick the repo.
3. `netlify.toml` already sets base `weight-loss-hub`, build `npm ci && npm run build` and publish `dist`. Click **Deploy**.

### Vercel

1. In Vercel, go to **Add New → Project** and import the repo.
2. Set **Root Directory** to `weight-loss-hub`. The framework is detected as Vite, and `vercel.json` handles SPA rewrites and service-worker caching.
3. Click **Deploy**.

## Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Open it from the Home Screen icon once while online. After that it works fully offline, even mid-workout.
4. Go to **More → Settings → Export everything** now and then to keep a backup file. Import it on a new device to move everything across.
