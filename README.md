# Pipeline Pulse CRM

Pipeline Pulse CRM is a lightweight pipeline review dashboard for B2B SaaS sales teams. It helps sales managers scan open opportunities, identify risky deals, compare owner books, and understand weighted pipeline.

The current implementation is intentionally local-first: CRM records are seeded from JSON into a local SQLite database, FastAPI serves the demo API and static files, business logic runs in the browser, and tests cover the scoring and summary functions.

## Features

- Open and weighted pipeline metrics.
- Owner-level filtering.
- Account health overview.
- Opportunity cards with amount, stage, probability, weighted value, and recent activity age.
- FastAPI API backed by local SQLite.
- Deterministic deal-risk scoring.
- Forecast categories: `Commit`, `Best Case`, `Pipeline`, and `At Risk`.
- Unit tests for CRM scoring and summary logic.

## Project Structure

```text
.
├── AGENTS.md
├── data/
│   └── crm.json
├── index.html
├── package.json
├── pyproject.toml
├── backend/
│   ├── database.py
│   └── main.py
├── src/
│   ├── crm.js
│   ├── main.js
│   └── styles.css
└── test/
    └── crm.test.js
```

## Run Locally

```bash
npm test
npm run dev
```

Open:

```text
http://localhost:5173
```

The first backend run creates `data/crm.sqlite` from `data/crm.json`. Delete that SQLite file to reseed from the fixture.

Useful API endpoints:

```text
GET /api/health
GET /api/crm
```

## CRM Data

The dashboard seeds `data/crm.sqlite` from `data/crm.json` with these record groups:

- `accounts`: company profile, owner, segment, health, ARR, and renewal date.
- `opportunities`: stage, amount, probability, close date, next step, activity age, and contact coverage.
- `contacts`: account stakeholders and influence level.
- `tasks`: open sales follow-ups and due dates.
- `activities`: recent calls, emails, and notes.

## Pipeline Logic

Core logic lives in `src/crm.js`.

- `scoreDealRisk` assigns a 0-100 risk score based on stale activity, missing next step, contact coverage, close-date pressure, deal size, and account health.
- `riskLabel` maps scores to `Low`, `Medium`, `High`, or `Critical`.
- `forecastCategory` maps opportunities into forecast buckets.
- `summarizePipeline` calculates open pipeline, weighted pipeline, critical deal count, and overdue task count.

## Development Notes

- Keep CRM calculations deterministic so sales users can understand why a deal is flagged.
- This test PR verifies that repository write access and review flow are working.
- Update tests whenever scoring, forecast, filtering, or summary behavior changes.
- Keep browser code in `src/main.js` thin; business rules belong in `src/crm.js`.
- Avoid adding external dependencies unless they materially simplify the app.
