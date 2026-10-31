# FreshRoute AI

AI-powered food logistics hackathon marketplace built with React, FastAPI and SQLite. Browse sample produce, create listings and buyer requirements, reserve stock, inspect supply-demand charts and compare stock/price-based matches. Generated products, growers, prices and history are explicitly **demo data**, not real offers.

## Marketplace scope

- SQLite persists listings, buyer requirements and local order reservations. Seed data includes 12 products, four buyer requirements and seven days of illustrative demand history.
- Product creation and requirements use validated forms/API inputs. Orders reserve available stock atomically and reject overselling. No payment or actual supplier notification occurs.
- Matching uses stored produce names, maximum buyer price and available stock; its score is the percentage of requested quantity currently available. It is deterministic matching, not a trained AI algorithm.
- The forecast is the seven-day arithmetic mean of seeded demand history. It is a transparent demo baseline, not a trained prediction model or a measured business forecast.
- The delivery map is a planning visualization; it is not live tracking, a road-network optimizer or a verified delivery quote.
- Snowflake CoCo and Solana remain unintegrated. GitHub Copilot usage still requires genuine evidence.

The cloud AI adapter uses hosted Gemma; no Ollama service or local model download is required. The assistant accepts actual supplied data and reports unavailable/configuration errors without fabricated AI results. See [submission status and evidence checklist](docs/SUBMISSION.md).

## Stack

- React + Vite + Tailwind CSS
- FastAPI + Python's built-in SQLite driver
- Recharts, React Leaflet, Leaflet, and Lucide React declared as dependencies

## Windows PowerShell setup

Prerequisites: Node.js 22.12+ and Python 3.12+. Run from the project root:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
cd frontend
npm.cmd install
cd ..
```

If `python` resolves to a broken Windows Store alias, use a real interpreter's full path. On the setup machine this command works:

```powershell
& "$env:APPDATA/uv/python/cpython-3.12.13-windows-x86_64-none/python.exe" -m venv .venv
```

### Terminal 1 — backend

```powershell
cd D:\Hackathone\freshroute-ai
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2 — frontend

```powershell
cd D:\Hackathone\freshroute-ai\frontend
npm.cmd run dev
```

Open http://127.0.0.1:5173. API documentation: http://127.0.0.1:8000/docs. Press Ctrl+C in each terminal to stop its server. Virtual environment activation is unnecessary.

## Verify

Backend tests (provider responses are mocked in unit tests, not live evidence):

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s backend -p 'test_*.py' -v
```

The assistant endpoint is `POST /api/ai/assist`. Send `task` and actual `data`: `description` requires `produce`; `forecast` requires `forecast`; `matching` requires `listings` and `requirements`; `logistics` requires `routes` and `demand`. `photo` accepts `image_base64` and `image_mime` (JPEG/PNG/WebP, maximum 3 MB). These are AI explanations of supplied data; using demo inputs does not establish real-world logistics accuracy.

Marketplace API: `GET /api/marketplace` returns products, requirements, orders, history and summary. `GET/POST /api/products`, `GET/POST /api/requirements`, `GET/POST /api/orders` manage records; `GET /api/matches` returns deterministic matches. API schemas are available at `/docs`.

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-WebRequest http://127.0.0.1:5173 -UseBasicParsing
cd frontend
npm.cmd run build
```

Health response:

```json
{"status":"ok","application":"FreshRoute AI","database":"ok"}
```

SQLite is initialized at `backend/data/freshroute.db` on API startup. Marketplace tables and demo data are created once; subsequent starts preserve existing data. The health endpoint checks a SQLite connection and returns HTTP 503 if that check fails. User-created records are separate from demo seeds; reservations against demo listings remain labeled demo.

## Configuration

Both servers read the root `.env`; defaults work without it. See `.env.example`. Restart servers after configuration changes. `VITE_` variables are public and must never contain secrets. CORS permits `http://localhost:5173` and `http://127.0.0.1:5173` by default.

Set these **backend-only** variables in the root `.env`:

```dotenv
GEMMA_API_KEY=your_google_ai_studio_key
GEMMA_MODEL=gemma-4-26b-a4b-it
GEMMA_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Google documents this exact model in [Run Gemma with the Gemini API](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api). Documentation confirms an available model identifier; access for your key, quota, and a successful live response require runtime verification. Never substitute Gemini or another Gemma generation silently. Without a valid key the application must remain usable and AI must report **NOT CONFIGURED**. Do not put the API key in any `VITE_` variable or commit `.env`.

Other variables: `VITE_API_BASE_URL=http://127.0.0.1:8000`, `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`, and `DATABASE_PATH=backend/data/freshroute.db`.

Use `npm.cmd ci` with `frontend/package-lock.json` for repeat installs. SQLite files, environments, dependencies, and build output are ignored by Git. See [actual verification results](docs/TEST_RESULTS.md) for completed checks and remaining verification limits.

## Layout

```text
frontend/           React marketplace, AI assistant and Vite configuration
backend/main.py     FastAPI, CORS, SQLite initialization, health endpoint
backend/marketplace.py  Products, requirements, orders, matching and demo analytics
backend/gemma.py    Hosted Gemma adapter
requirements.txt    Python dependencies
.env.example        Local configuration template
LICENSE             MIT License
```

Tailwind uses the official [Vite plugin setup](https://tailwindcss.com/docs/installation/using-vite).

## License

MIT — see [LICENSE](LICENSE).
