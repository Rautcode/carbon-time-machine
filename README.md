# 🌍 Carbon Time Machine

> **See the environmental future created by your lifestyle decisions.**

Built for **#BuildwithAI Challenge 3** — *Help individuals understand, track, and reduce their carbon footprint.*

---

## 🎯 Vertical Chosen

**Personal Carbon Footprint Tracker with AI-Powered Future Projection**

Most carbon tools tell you *"you emit X tons"* — a number users forget in seconds.  
Carbon Time Machine tells you *"here is your life in 2030, 2035, and 2040 if you keep going"* — a story people remember.

---

## 💡 How It Works

1. **User enters lifestyle habits** — transport, diet, energy, shopping
2. **Deterministic calculator** computes a precise current footprint (IPCC AR6 + India CEA 2023 emission factors)
3. **Three scenarios are generated:**
   - 📈 **Current Path** — business-as-usual (2% annual growth)
   - 🚶 **Small Steps** — metro twice a week + LED upgrade
   - 🌿 **Committed Future** — public transport + vegetarian + solar + mindful shopping
4. **Google Gemini 1.5 Flash** generates a vivid 2-sentence narrative for each future year (2030/2035/2040)
5. **Users see** annual/cumulative CO₂, trees needed, financial cost, and AI storylines — side-by-side

---

## 🏗️ Architecture

```
carbon-time-machine/
├── backend/                  # FastAPI + Python 3.11
│   ├── app/
│   │   ├── core/config.py    # Settings via pydantic-settings
│   │   ├── models/schemas.py # Pydantic v2 request/response models
│   │   ├── services/
│   │   │   ├── carbon_calculator.py   # Pure deterministic emission math
│   │   │   ├── gemini_service.py      # Gemini API wrapper with fallbacks
│   │   │   └── scenario_generator.py # Orchestration layer
│   │   └── routers/scenarios.py      # FastAPI routes + rate limiting
│   └── tests/                # 25+ pytest unit + integration tests
│
└── frontend/                 # React 18 + TypeScript + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── InputForm/     # 4-section accessible form
        │   ├── Timeline/      # Year-by-year narrative timeline
        │   ├── FutureComparison/ # Scenario tab switcher
        │   └── shared/        # LoadingSpinner, ErrorMessage
        ├── hooks/useScenarios.ts  # API state management
        ├── utils/formatters.ts    # Pure formatting helpers
        └── __tests__/         # Vitest component + unit tests
```

---

## 🔐 Security

- **API key never in frontend** — Gemini key lives only in backend `.env`
- **Rate limiting** — 5 requests/minute per IP (slowapi)
- **Input validation** — Pydantic v2 with strict bounds on all fields
- **CORS locked** — only allow-listed origins
- **No raw SQL** — no DB at all; stateless computation

---

## ⚡ Efficiency

- All FastAPI handlers are `async`
- `@lru_cache` on settings to avoid re-parsing env on every request
- React `memo` + `useCallback` on all components and event handlers
- No heavy charting libraries — pure CSS/Tailwind visualizations
- Vite code-splitting for fast initial load

---

## ♿ Accessibility

- Skip-to-main-content link (keyboard users)
- `role="tablist"` / `role="tab"` / `role="tabpanel"` on scenario switcher
- `aria-live="polite"` on loading state, `aria-live="assertive"` on errors
- All form inputs have `<label>` + `aria-describedby` hints
- Diet selector uses visually hidden `<input type="radio">` with styled labels
- `prefers-reduced-motion` CSS media query — disables animations
- WCAG AA contrast ratios throughout
- `aria-busy` on submit button during loading

---

## 🧪 Testing

**Backend (pytest):**
```bash
cd backend
pytest tests/ -v
# 25+ tests covering:
# - All emission calculators (zero inputs, boundary values, math correctness)
# - API validation (invalid diet, negative values, missing fields)
# - Scenario ordering (committed > small > bau savings)
# - Timeline year ordering
```

**Frontend (vitest):**
```bash
cd frontend
npm test
# Tests cover:
# - Formatter utilities (formatTons, emissionColor, breakdownPercent)
# - InputForm rendering, accessibility, submit behavior
# - App routing, header, footer, skip link
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Gemini API key ([get free key](https://aistudio.google.com/app/apikey))

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
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

## 📊 Emission Factors Used

| Category | Factor | Source |
|----------|--------|--------|
| Car (petrol) | 0.21 kg CO₂/km | DEFRA 2023 |
| Domestic flight | 255 kg CO₂/flight | IPCC AR6 |
| International flight | 1,200 kg CO₂/flight | IPCC AR6 |
| India grid electricity | 0.82 kg CO₂/kWh | India CEA 2023 |
| Meat-heavy diet | 7.19 kg CO₂/person/day | IPCC AR6 |
| Vegan diet | 2.89 kg CO₂/person/day | IPCC AR6 |

---

## 🤔 Assumptions

- All flights counted as one-way (conservative)
- Public transport mix: 50% bus, 50% metro
- "Local food" reduces food emissions by max 10% (transport component only)
- Home energy includes cooking gas proxy: 0.4 kg CO₂/sqft/year
- Financial cost = fuel + electricity (most controllable costs)
- BAU trajectory: 2% annual growth; committed: -1% annual reduction
- A mature tree absorbs ~21 kg CO₂/year (USDA Forest Service)

---

*#BuildwithAI #PromptWarsVirtual #Challenge3*  
*Tags: @googlefordevelopers @hack2skill*
