# Weather Explorer

A small full-stack tool that fetches historical daily weather from [Open-Meteo](https://open-meteo.com/),
stores the raw response in a cloud bucket, and lets you browse and visualize what's stored.

Built for the InRisk Labs full-stack case study.

## Architecture

```
weather-explorer/
├── backend/     FastAPI service: validates input, calls Open-Meteo, stores/retrieves JSON in GCS
└── frontend/    React (Vite) + Tailwind dashboard: form, file browser, chart, table
```

The frontend never re-hits Open-Meteo directly — every view after the initial fetch reads back
from whatever is already stored in the bucket, via `GET /list-weather-files` and
`GET /weather-file-content/{file}`.

## Backend

**Stack:** Python, FastAPI, `google-cloud-storage`, deployed on Cloud Run.

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

The GCS client in `app/storage.py` resolves credentials lazily, on first use, not at import — so the
app can be imported/tested without any GCP credentials present.

### Local setup

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # fill in GCS_BUCKET_NAME, and GOOGLE_APPLICATION_CREDENTIALS for local runs
pytest                 # runs the validation test suite
uvicorn app.main:app --reload --port 8000
```

Requires Python 3.10+ (the `X | None` type hints won't parse on older Pythons). The Docker image
pins `python:3.11-slim` to match.

### GCP setup (not yet done — needs your login)

1. `gcloud auth login` and `gcloud config set project <your-project>`
2. Create a bucket: `gcloud storage buckets create gs://<bucket-name> --location=<region>` (stay on
   the Always Free tier: Standard storage, US regions, well under the free 5 GB)
3. Deploy: from `backend/`, `gcloud run deploy weather-explorer-api --source . --region <region> --allow-unauthenticated --set-env-vars GCS_BUCKET_NAME=<bucket-name>,ALLOWED_ORIGINS=<your-netlify-url>`
4. Grant the Cloud Run service's runtime service account `roles/storage.objectAdmin` on the bucket

I haven't run any of this yet — it needs your GCP account. Say the word and I'll walk through it
with you (or hand you the exact commands to run yourself).

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
3. Set `VITE_API_BASE_URL` to the deployed Cloud Run URL in Netlify's environment variables
4. Once you have the Netlify URL, update the backend's `ALLOWED_ORIGINS` and redeploy

## Design decisions

- **FastAPI over Flask** — Pydantic models give us the lat/lon/date validation from the spec almost
  for free, and map cleanly onto clear 400 error messages.
- **Cloud Run over Lambda** — one Dockerfile, no API Gateway wiring, and its always-free tier covers
  this workload comfortably.
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
- End-to-end testing against a real bucket hasn't happened yet — that needs a real GCS bucket and
  credentials (see GCP setup above).

## Status

- [x] Backend implemented, tests passing (`pytest` — 11/11)
- [x] Frontend implemented, builds and dev-serves cleanly
- [ ] Deployed to Cloud Run (needs GCP login)
- [ ] Deployed to Netlify (needs Netlify login)
- [ ] Pushed to GitHub (needs `gh` auth as shraddha-999)
