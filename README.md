# Weather Explorer

A small full-stack tool that fetches historical daily weather from [Open-Meteo](https://open-meteo.com/),
stores the raw response in a cloud bucket, and lets you browse and visualize what's stored.

Built for the InRisk Labs full-stack case study.

## Architecture

```
weather-explorer/
├── backend/     FastAPI service: validates input, calls Open-Meteo, stores/retrieves JSON in Supabase Storage
└── frontend/    React (Vite) + Tailwind dashboard: form, file browser, chart, table
```

The frontend never re-hits Open-Meteo directly — every view after the initial fetch reads back
from whatever is already stored in the bucket, via `GET /list-weather-files` and
`GET /weather-file-content/{file}`.

## Backend

**Stack:** Python, FastAPI, `supabase` (Storage), deployed on Render.

### Endpoints

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/store-weather-data` | Validates lat/lon/date range, calls Open-Meteo, stores the raw JSON as `weather_<lat>_<lon>_<start>_<end>_<timestamp>.json` |
| `GET` | `/list-weather-files` | Lists bucket contents: name, size, created_at |
| `GET` | `/weather-file-content/{file}` | Returns the stored JSON, or `404 {"status":"error","message":"not found"}` |

Validation lives in `app/schemas.py` (Pydantic): latitude ∈ [-90, 90], longitude ∈ [-180, 180],
`start_date ≤ end_date`, range ≤ 31 days. Validation and other errors both come back as
`{"status": "error", "message": "..."}` — invalid input is a 400, a missing file is a 404, anything
downstream failing (Open-Meteo, GCS) is a 502/500 — via the exception handlers in `app/main.py`.

The Supabase client in `app/storage.py` is created lazily, on first use, not at import — so the
app can be imported/tested without any Supabase credentials present.

### Local setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_KEY (the secret key), SUPABASE_BUCKET_NAME
pytest                 # runs the validation test suite
uvicorn app.main:app --reload --port 8000
```

Requires Python 3.10+ (the `X | None` type hints won't parse on older Pythons). The Docker image
pins `python:3.11-slim` to match.

### Supabase setup (done)

1. Created a free Supabase project (no card required)
2. Created a private Storage bucket named `weather-data`
3. Backend uses the project's **secret** API key (`SUPABASE_KEY`, server-side only — never expose it
   to the frontend) to read/write objects

### Render deploy

1. Push this repo to GitHub
2. In the Render dashboard, "New +" → "Web Service" → connect the GitHub repo, root directory
   `backend/`, environment: Docker
3. Set env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET_NAME`, `ALLOWED_ORIGINS`
4. Render builds the Dockerfile and deploys — free tier, no card required (cold starts after
   idle periods are expected on the free tier)

> **Note on GCP/Cloud Run:** we originally targeted Cloud Run + GCS, but the GCP billing account
> hit a card-verification failure ("not in good standing") that self-service couldn't resolve.
> Render + Supabase Storage needs no billing/card setup at all for this workload, so we switched
> rather than wait on Google support.

## Frontend

**Stack:** React 18, Vite, Tailwind CSS, deployed on Netlify.

Three panels: an input form (`POST /store-weather-data`), a stored-files browser
(`GET /list-weather-files` → `GET /weather-file-content/{file}`), and a visualization pane — a
hand-rolled SVG line chart (max/min temperature) plus a paginated table (10/20/50 rows). No charting
library — kept dependency-light and fully our own code.

### Local setup

```bash
cd frontend
nvm use            # picks up Node 20 via .nvmrc — Vite 5 needs Node 18+
npm install
cp .env.example .env   # VITE_API_BASE_URL, defaults to http://localhost:8000
npm run dev
```

### Netlify deploy (not yet done — needs your login)

1. `netlify login`
2. From `frontend/`: `netlify deploy --build --prod` (or connect the GitHub repo in the Netlify
   dashboard for git-based deploys)
3. Set `VITE_API_BASE_URL` to the deployed Render URL in Netlify's environment variables
4. Once you have the Netlify URL, update the backend's `ALLOWED_ORIGINS` on Render and redeploy

## Design decisions

- **FastAPI over Flask** — Pydantic models give us the lat/lon/date validation from the spec almost
  for free, and map cleanly onto clear 400 error messages.
- **Render over Cloud Run/Lambda** — one Dockerfile, git-push deploys, and a free tier that needs no
  card on file (see the GCP note above for why we moved off Cloud Run).
- **Supabase Storage over GCS/S3** — S3-compatible-enough object storage with a free tier that also
  needs no card on file, keeping the whole stack card-free end to end.
- **Hand-rolled SVG chart over a charting library** — the case study explicitly asks that every line
  be explainable; a ~60-line chart we wrote ourselves is easier to stand behind than a library's
  internals, and it avoids a dependency for one chart.
- **Frontend reads only from storage** — the dashboard calls Open-Meteo exactly once, at store time;
  every subsequent view/select reads back the stored file, per the "avoid excessive external API
  calls" requirement.

## Known limitations

- `npm audit` flags a moderate advisory in `esbuild` (bundled with Vite 5) — it only affects the
  local dev server accepting cross-origin requests, not the production build in `dist/`. Not fixed
  yet since the fix is a Vite 5 → 8 major bump; flagging here rather than silently upgrading.
- Render's free tier spins down after inactivity, so the first request after a while will be slow
  (cold start) — acceptable for a case study, would need a paid tier to avoid in production.

## Status

- [x] Backend implemented, tests passing (`pytest` — 11/11)
- [x] Frontend implemented, builds and dev-serves cleanly
- [x] Supabase project + private `weather-data` bucket created, backend verified end-to-end
      locally (store → list → fetch, including 404 handling) against the real bucket
- [ ] Deployed to Render (needs repo pushed to GitHub first)
- [ ] Deployed to Netlify (needs Netlify login)
- [ ] Pushed to GitHub (needs `gh` auth as shraddha-999)
