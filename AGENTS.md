# Repository Guidelines

## Architecture

Pipeline Pulse CRM is a static client-side dashboard for reviewing open pipeline, account health, and deal risk.

- `data/crm.json` contains the local CRM fixture data used by the dashboard.
- `src/crm.js` contains business logic for scoring risk, assigning forecast categories, filtering owner books, and building account snapshots.
- `src/main.js` loads CRM data and renders the browser UI.
- `src/styles.css` contains application styling.
- `test/crm.test.js` covers CRM business logic with Node's built-in test runner.

## Engineering Rules

- Keep pipeline calculations deterministic and explainable.
- Put reusable sales-operations logic in `src/crm.js`; keep `src/main.js` focused on rendering and browser events.
- Add or update tests for changes to risk scoring, forecast categories, owner filters, account snapshots, or pipeline summaries.
- Prefer data-shape changes in `data/crm.json` over hardcoded special cases in UI code.
- Do not introduce external services, API keys, or network-dependent runtime behavior.
- Preserve the no-build setup unless a feature clearly requires a build step.

## Feature Workflow

- When work starts from an existing ticket, treat the ticket as the initial source of truth. Create a ticket-specific subfolder under `features/`, copy the files from `features/template`, and name the folder with the ticket identifier and short feature slug when available, such as `features/ELI-808-deal-risk-explanation`.
- For ticket-driven work, first determine whether the ticket already contains enough product context. If it does, summarize the ticket in the feature folder and move directly into technical requirements and implementation planning. If product goals, users, scope, acceptance criteria, or explainability requirements are unclear, start by drafting or refining the PRD before implementation planning.
- When the user asks to build a feature that is not based on a ticket, use the normal product-first flow: create a feature-named subfolder under `features/`, copy the template files, draft the PRD, then derive technical requirements, implementation plan, and tickets from that PRD as needed.
- Do not code before the appropriate feature documents exist unless the user explicitly asks for a small direct change or emergency fix.

## Product Rules

- Risk labels should help sales managers find deals that need attention, not punish every imperfect deal.
- Forecast categories should remain easy to explain: `Commit`, `Best Case`, `Pipeline`, and `At Risk`.
- Account health and opportunity risk are related but separate concepts.
- Owner filters should affect pipeline metrics, opportunities, accounts, and tasks consistently.
- Any recommendation feature should expose why the recommendation was made.

## Post-Implementation Verification

After implementing a feature or behavior change, run the relevant checks before handing off. Use `npm test` for business logic changes, especially risk scoring, forecast categories, owner filters, account snapshots, and pipeline summaries. For UI changes, also run `npm run dev` and verify the dashboard still loads.
