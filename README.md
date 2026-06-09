# 🌍 Carbon Time Machine

> **See the environmental future created by your lifestyle decisions.**

Built for **Google Prompt Wars — Hack2Skill Challenge 3**  
*"Help individuals understand, track, and reduce their carbon footprint."*

🔗 **Repo:** https://github.com/Rautcode/carbon-time-machine

---

## What It Does

Most carbon tools show you a number — *"you emit 6.2 tons/year"* — and you forget it in seconds.

**Carbon Time Machine shows you a story:** your life in 2030, 2035, and 2040 across three different futures, with AI-generated narratives, financial projections, and a Paris 1.5°C alignment check.

---

## Features

| Feature | Detail |
|---------|--------|
| 🎛️ **Live sliders** | All inputs are range sliders with real-time gradient fill |
| 📊 **Animated CO₂ gauge** | SVG circular gauge — colour-coded Low / Moderate / High / Critical |
| 🌡️ **Paris 1.5°C badge** | Green if your Committed 2030 footprint is ≤ 2.0 t, red if not |
| 📱 **Shadow / digital carbon** | HD streaming (36 g CO₂/hr, IEA 2023) + online deliveries (300 g CO₂/package) |
| 🤖 **AI narratives** | Google Gemini 1.5 Flash writes a vivid 2-sentence story for each future year |
| 💡 **AI carbon tips** | Gemini generates 5 personalised reduction tips ranked by your highest categories |
| 🌐 **Live climate widget** | Real-time India temperature via Open-Meteo + IPCC global anomaly + CO₂ ppm |
| 👤 **Persona presets** | One-click profiles: Student · Urban Pro · Family · Minimalist |
| 📈 **3 future scenarios** | Business-as-Usual · Small Steps · Committed (Paris-aligned) |
| 💰 **Financial projection** | Annual fuel + electricity cost saved by scenario |
| 🌲 **Tree equivalents** | Tonnes saved → trees to plant (USDA: 21 kg CO₂/tree/year) |

---

## How It Works

```
User fills form (transport / food / energy / shopping / digital)
        │
        ▼
Deterministic calculator  ──  IPCC AR6 + India CEA 2023 + IEA 2023 emission factors
        │
        ▼
3 scenario trajectories   ──  BAU (+2%/yr) · Small Steps · Committed (–1%/yr)
        │
        ▼
Gemini 1.5 Flash          ──  2-sentence narrative per year per scenario
        │
        ▼
Results page              ──  Gauge · Paris badge · Timeline · Savings banner
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11 · FastAPI · Pydantic v2 · slowapi |
| AI | Google Gemini 1.5 Flash |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS |
| Testing | pytest (75 tests) · Vitest + @testing-library/react (39 tests) |

---

## Architecture

```
carbon-time-machine/
├── backend/
│   ├── app/
│   │   ├── core/config.py            # Pydantic-settings; @lru_cache singleton
│   │   ├── models/schemas.py         # Strict Pydantic v2 request/response models
│   │   ├── services/
│   │   │   ├── carbon_calculator.py  # Pure emission math (no I/O)
│   │   │   ├── scenario_generator.py # Orchestration: calc → Gemini → response
│   │   │   ├── gemini_service.py     # Gemini API wrapper with sanitized fallbacks
│   │   │   ├── tips_service.py       # Gemini-powered personalised CO₂ tips
│   │   │   ├── climate_service.py    # Open-Meteo live temp + IPCC anomaly
│   │   │   └── sanitizer.py         # Strip HTML/scripts from AI output
│   │   └── routers/
│   │       ├── scenarios.py         # POST /api/scenarios · rate-limited
│   │       └── extras.py            # GET /api/climate · POST /api/tips
│   └── tests/                       # 75 pytest tests, exit 0
│
└── frontend/
    └── src/
        ├── components/
        │   ├── InputForm/            # 5-section form with live sliders + persona presets
        │   ├── FutureComparison/     # Gauge · Paris badge · breakdown · sidebar layout
        │   ├── Timeline/             # Year-by-year animated timeline cards
        │   ├── TipsPanel/            # Lazy-loaded AI carbon reduction tips
        │   ├── ClimateWidget/        # Live temperature + CO₂ ppm in header
        │   └── shared/               # LoadingSpinner · ErrorMessage
        ├── hooks/useScenarios.ts     # API state (loading / error / data)
        ├── utils/formatters.ts       # formatTons · formatINR · emissionColor
        └── __tests__/               # 39 Vitest tests, exit 0
```

---

## Security

| Control | Implementation |
|---------|---------------|
| API key isolation | Gemini key lives only in `backend/.env` — never sent to the browser |
| Rate limiting | 5 req/min per IP via slowapi |
| Input validation | Pydantic v2 strict bounds on every field (negative values, >100% rejected) |
| Response headers | `X-Content-Type-Options` · `X-Frame-Options: DENY` · `X-XSS-Protection` · CSP · Permissions-Policy |
| CORS | Explicit allow-list; no wildcard origins |
| XSS | Zero `innerHTML` / `dangerouslySetInnerHTML` — all AI output is text-node rendered |
| Stateless | No database, no file writes, no persistent state |

---

## Accessibility

- Skip-to-main-content link (keyboard navigation)
- `role="tablist"` / `role="tab"` / `role="tabpanel"` on scenario switcher
- `aria-live="polite"` on loading state; `aria-live="assertive"` on errors
- All range sliders have `aria-valuemin/max/now/text`
- Diet picker uses visually hidden `<input type="radio">` with styled labels (`role="radiogroup"`)
- `aria-busy` on submit button during loading
- `prefers-reduced-motion` — disables all CSS animations
- WCAG AA contrast ratios throughout (all text ≥ gray-600)
- `<html lang="en">` set

---

## Testing

```bash
# Backend — 75 tests
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
pytest tests/ -v
```

```bash
# Frontend — 39 tests
cd frontend
npm install
npm test
```

Test coverage includes:
- All 6 emission calculators (zero inputs, boundary values, exact math)
- `TestDigitalCarbon` — streaming + delivery carbon math
- API validation (invalid diet type, negative values, out-of-range fields)
- Rate limiter storage isolation between tests
- Scenario ordering (`committed ≥ small ≥ bau` savings)
- React components: InputForm rendering, FutureComparison tabs, Timeline display
- Security headers on every response

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key — [get a free key](https://aistudio.google.com/app/apikey)

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Open .env and set GEMINI_API_KEY=your_key_here
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Emission Factors

| Category | Factor | Source |
|----------|--------|--------|
| Car (petrol) | 0.21 kg CO₂/km | DEFRA 2023 |
| Domestic flight | 255 kg CO₂/flight | IPCC AR6 |
| International flight | 1,200 kg CO₂/flight | IPCC AR6 |
| Public transport | 0.089 kg CO₂/km | Bus/metro mix |
| India grid electricity | 0.82 kg CO₂/kWh | India CEA 2023 |
| Meat-heavy diet | 7.19 kg CO₂/person/day | IPCC AR6 |
| Vegetarian diet | 3.81 kg CO₂/person/day | IPCC AR6 |
| Vegan diet | 2.89 kg CO₂/person/day | IPCC AR6 |
| Clothing | 33.4 kg CO₂/item | DEFRA 2023 |
| Electronics | 70 kg CO₂/item | DEFRA 2023 |
| HD video streaming | 0.036 kg CO₂/hr | IEA 2023 |
| Online delivery | 0.30 kg CO₂/package | Standard delivery |

---

## Key Assumptions

- Flights counted as one-way (conservative estimate)
- Public transport mix: bus + metro average
- Local food reduces emissions by max 10% (transport component only)
- Home energy includes cooking gas proxy: 0.4 kg CO₂/sqft/year
- Financial cost tracks fuel + electricity (most actionable costs)
- BAU trajectory: +2% annual growth; Committed: −1% annual reduction
- Paris 1.5°C per-capita budget: **2.0 t CO₂e/year** (IPCC SR1.5)
- Mature tree absorbs ~21 kg CO₂/year (USDA Forest Service)

---

*#BuildwithAI #PromptWarsVirtual #Challenge3 · @googlefordevelopers @hack2skill*
