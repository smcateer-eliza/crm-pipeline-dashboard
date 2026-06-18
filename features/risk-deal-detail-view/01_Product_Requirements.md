# Product Requirements Document

## 1. Overview

### Feature Name

`Risk vs Deal Detail View`

### Summary

Create a new full-page dashboard view that helps sales managers compare opportunity risk against deal details such as amount, stage, probability, close date, owner, account health, and risk drivers. The feature should make it easier to answer: which deals are both important and risky, why are they risky, and what should a manager inspect next?

### Background

The current dashboard shows pipeline metrics, account health, and opportunity cards on a single page. Opportunities are already enriched with deterministic values in `src/crm.js`, including weighted amount, risk score, risk label, and forecast category. However, the current card list makes it harder to compare risk across the whole book because each opportunity is presented as an individual record rather than as a portfolio-level risk visualization.

## 2. Goals

### Business Goals

- Help sales leaders quickly identify high-value risky deals during pipeline review.
- Make risk scoring more explainable by surfacing the specific deal details that contributed to risk.
- Preserve trust in forecast and risk logic by keeping calculations deterministic and transparent.

### User Goals

- As a sales manager, I want to see which large deals have the highest risk so I can focus coaching time.
- As an account executive, I want to understand why a deal is flagged so I can fix the underlying issue.
- As revenue operations, I want a consistent view that respects owner filtering and existing forecast categories.

### Non-Goals

- Do not introduce external CRM integrations or network-dependent runtime behavior.
- Do not replace the existing overview dashboard in the first version.
- Do not change the meaning of the existing forecast categories unless explicitly decided.
- Do not add machine-learning or opaque recommendation logic.

## 3. Users and Use Cases

### Primary Users

- Sales managers
- Account executives
- Revenue operations

### Key Use Cases

1. A sales manager needs to compare deal size and risk score so they can prioritize inspection of the most material risks.
2. An account executive needs to inspect risk drivers for a flagged opportunity so they can decide the next action.
3. Revenue operations needs to validate forecast categories against risk signals so they can spot pipeline hygiene issues.

## 4. Current Experience

Users land on the main dashboard, review four summary metrics, inspect account health, and scan opportunity cards sorted by risk score. Each card includes risk label, score, next step, account, stage, amount, weighted amount, forecast category, probability, activity age, and contact coverage.

### Pain Points

- Comparing risk against deal amount requires reading multiple cards rather than scanning a portfolio view.
- Risk scores are visible, but the exact contributing risk reasons are not shown as a structured explanation.
- Forecast category and risk label are shown together, but there is no dedicated view for spotting mismatches such as high-probability deals with stale activity.
- The current page works well for a short fixture but may become harder to scan as more opportunities are added.

## 5. Proposed Experience

Add a new full-page view focused on risk analysis. The user can navigate from the current dashboard to the risk view. The risk view shows a scatter plot comparing risk score against raw deal amount, plus a ranked deal-detail area that remains filtered by selected owner.

### User Flow

1. User lands on the current dashboard and chooses an owner filter, or keeps `All owners`.
2. User opens the `Risk View`.
3. User reviews a scatter plot that positions each opportunity by risk score and raw deal amount.
4. User scans a ranked detail list to view risk drivers, forecast category, activity age, contact coverage, next step, account health, stage, close date, and weighted amount.
5. User returns to the overview dashboard or changes owner filter to inspect another book.

### UX Requirements

- The feature must be understandable without training.
- Risk outputs must expose the reason they were produced.
- Owner filters must apply consistently to the risk visualization and deal details.
- The view must not rely on color alone to communicate risk severity.
- The page should be useful with the current fixture size and remain readable if more deals are added.

## 6. Functional Requirements

| ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| FR-1 | Provide a full-page risk analysis view separate from the existing overview dashboard. | Must | Could be a second static page or routed view; implementation decision remains open. |
| FR-2 | Visualize opportunities by risk score and raw deal amount. | Must | Use a scatter plot for V1. |
| FR-3 | Show structured deal details for each opportunity. | Must | Include amount, weighted amount, stage, probability, close date, owner, account, account health, forecast category, risk score, and risk label. |
| FR-4 | Show explainable risk drivers for each opportunity. | Must | Risk drivers should map to existing scoring rules. |
| FR-5 | Preserve owner filtering behavior. | Must | Owner filters should affect visualization, detail records, and any summary counts. |
| FR-6 | Allow users to move between the overview dashboard and risk view. | Should | Navigation should be simple and static-app friendly. |
| FR-7 | Add a focused empty state for owner filters with no matching opportunities. | Should | The current fixture has deals for every owner, but future data may not. |
| FR-8 | Add optional sorting or filtering within the risk view. | Could | V1 detail list should default to high-risk, high-amount priority. Additional sort controls can be deferred. |

## 7. Data Requirements

### Inputs

- `opportunity.amount`
- `opportunity.probability`
- `opportunity.stage`
- `opportunity.closeDate`
- `opportunity.nextStep`
- `opportunity.lastActivityDays`
- `opportunity.contactCoverage`
- `account.owner`
- `account.health`
- Existing derived values: `weightedAmount`, `riskScore`, `riskLabel`, `forecastCategory`

### Outputs

- Risk-vs-value scatter plot position
- Deal detail rows or cards
- Risk driver list per opportunity
- Owner-aware risk summary counts

### Data Shape Changes

No required fixture data shape changes are expected for the first version. The current CRM fixture already contains the fields needed to explain the existing risk score.

If richer explanations are desired later, fixture data could add more explicit sales process fields such as champion status, procurement status, buying committee coverage, or mutual action plan status.

## 8. Business Logic

The first version should reuse the existing risk and forecast behavior. Any new logic should be additive and explainable, not a replacement for current scoring.

### Rules

1. `Risk score`: Reuse the current additive score from `scoreDealRisk`.
2. `Risk label`: Reuse current label thresholds: `Critical`, `High`, `Medium`, and `Low`.
3. `Forecast category`: Reuse current forecast assignment: `At Risk`, `Commit`, `Best Case`, and `Pipeline`.
4. `Risk drivers`: Return the individual scoring contributors that explain the final score.
5. `Risk-vs-value placement`: Use `riskScore` for the risk axis and raw `amount` for the value axis.

### Explainability

For each opportunity, the UI should be able to show a concise list of risk drivers such as:

- `Stale activity: 18 days since last activity (+18)`
- `Account health: At Risk (+24)`
- `Large deal: $185K amount (+10)`
- `Close-date pressure: closes within 21 days outside Negotiation (+12)`

## 9. Edge Cases

- Missing or blank `nextStep`
- Opportunity linked to a missing account
- Empty owner book after filtering
- Opportunity with high account health risk but otherwise healthy deal signals
- Opportunity with high probability but stale activity
- Very small deal with high operational risk
- Very large deal with low risk
- Multiple opportunities with the same risk score and amount

## 10. Success Metrics

### Product Metrics

- Users can identify the top risky high-value opportunities without reading every card.
- Users can explain why a deal has its risk label from visible data on the page.
- Users can switch owner filters and see the risk view update consistently.

### Quality Metrics

- Calculation behavior is covered by tests in `test/crm.test.js`.
- Dashboard loads successfully through `npm run dev`.
- Existing overview behavior is preserved.

## 11. Rollout Plan

### Release Scope

First version ships a local static risk view using the existing CRM fixture and existing deterministic scoring. It adds risk-driver explainability, a scatter plot, and a ranked deal-detail layout, but does not change CRM persistence, external data loading, or scoring thresholds.

### Dependencies

- Existing CRM fixture fields in `data/crm.json`
- Existing enrichment logic in `src/crm.js`
- Existing owner filter pattern in `src/main.js`

### Risks

- `Visualization complexity`: Keep the scatter plot simple enough to work without a charting dependency.
- `Risk explanation drift`: Generate risk drivers from the same rules used for scoring.
- `Navigation complexity`: Prefer a static-friendly approach that preserves the no-build setup.

## 12. Testing Plan

### Automated Tests

- Add tests for risk-driver output from scoring logic.
- Add tests ensuring risk-driver point totals align with final risk scores.
- Add or update owner-filter tests if risk-view summaries are added.

### Manual Verification

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the overview dashboard still loads.
4. Navigate to the risk view.
5. Verify all owners and individual owner filters update the visualization and detail list.
6. Verify each visible risk driver corresponds to a scoring rule.

## 13. Open Questions

- Should scatter plot points be clickable and synchronize with the ranked detail list in V1, or should the plot be read-only initially?
- Should the scatter plot include visual reference bands for risk thresholds and deal-size tiers?
- Should the owner filter state persist when moving between the overview and risk view?

## 14. Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Start feature as a spec-only planning pass. | Codex | Implementation details remain open for user iteration. |
| 2026-06-10 | Use a scatter plot for the primary visualization. | User | User explicitly selected scatter plot. |
| 2026-06-10 | Use raw deal amount as the value axis. | Codex | Recommended default for sales-manager prioritization. |
| 2026-06-10 | Optimize V1 for sales managers. | Codex | Recommended primary audience. |
| 2026-06-10 | Use a full-page view inside the existing app shell. | Codex | Recommended to preserve no-build setup and avoid a second app path. |
| 2026-06-10 | Pair scatter plot with a ranked inline detail list. | Codex | Recommended so risk reasons remain visible without requiring selection. |
