# AssetIQ — Intelligent Asset Lifecycle Management

A frontend for a predictive, industrial asset-management platform: machine monitoring, ML-driven failure prediction, maintenance scheduling, lifecycle tracking, resale valuation, and an engineering copilot.

## Stack

- React 18 + Vite (JavaScript/JSX)
- React Router v6
- Tailwind CSS
- Recharts
- lucide-react icons

## Run it

```bash
cd frontend
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## What's mocked

There is no backend in this build. All ML predictions, sensor readings, and maintenance schedule calculations are served from `src/services/*.js`, which simulate the contract described below with in-memory mock data (`src/data/machines.js`). Swap these service functions for real `fetch`/`axios` calls to your backend and the rest of the app is unaffected — no component computes prediction, RUL, or schedule values itself.

### Core prediction contract

```
POST /api/analyze-machine
{
  "machine_type": "CNC",
  "machine_id": "CNC-2334",
  "previous_maintenance_date": "2026-08-18"
}
```

Response includes sensor telemetry, RUL, failure probability/type, repair cost estimate, health score, risk level, and a recommendation. See `src/services/predictionService.js` for the exact shape.

## Structure

```
src/
├── components/   Shared UI (Sidebar, Layout, Cards, badges, forms)
├── pages/        One file per route
├── services/     Mocked backend/ML calls — swap for real API calls
├── context/      Auth + selected-machine state
├── hooks/        Data-fetching hooks
├── data/         Mock fleet + sensor history generator
└── utils/        Formatting + status/risk color helpers
```

## Pages

`/login` `/dashboard` `/machines` `/machines/:machineId` `/analytics` `/maintenance` `/lifecycle` `/resale` `/copilot`
