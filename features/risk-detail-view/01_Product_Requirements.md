# Product Requirements Document

## 1. Overview

### Feature Name

`Risk Detail View`

### Summary

Create a full-page view that helps sales managers compare deal risk against the underlying opportunity details. The view should make it easier to answer: which deals are most exposed, why are they risky, and what deal attributes are driving that risk?

### Background

The current dashboard shows risk labels, risk scores, forecast category, stage, amount, weighted amount, probability, activity age, contact coverage, and next step on opportunity cards. This is useful for scanning, but it does not give managers a focused workspace for comparing all risk drivers across the book.

The existing risk and forecast logic is deterministic in `src/crm.js`. This feature should reuse and extend that logic without introducing network services or a build step.

## 2. Goals

### Business Goals

- Help sales managers prioritize coaching and deal inspection during pipeline review.
- Make risk scoring more transparent by showing the deal attributes and reasons behind each score.
- Preserve explainable forecast and risk behavior.

### User Goals

- See all open deals in a risk-focused full-page view.
- Compare risk score, forecast category, stage, amount, probability, activity age, contact coverage, account health, close date, and next step in one place.
- Understand why each deal received its risk score.
- Filter by owner consistently with the rest of the dashboard.

### Non-Goals

- Changing the existing risk scoring thresholds in the first version.
- Adding external CRM integrations or remote data loading.
- Building edit workflows for CRM data.
- Replacing the existing dashboard overview page.

## 3. Users and Use Cases

### Primary Users

- Sales managers
- Account executives
- Revenue operations

### Key Use Cases

1. A sales manager needs to sort and compare risky deals so they can decide which opportunities need review first.
2. An account executive needs to understand why a deal is flagged so they can address the specific risk drivers.
3. Revenue operations needs to validate that risk and forecast categories remain explainable and consistent across owners.

## 4. Current Experience

Users start on the main dashboard, review summary metrics, optionally filter by owner, scan account health, and inspect opportunity cards. Risk data is visible per card, but comparison requires reading each card independently.

### Pain Points

- Risk score and deal details are shown per card, not in a comparison-friendly layout.
- The UI shows risk score but does not explicitly expose the scoring reasons.
- Managers cannot quickly see which risk drivers are common across a filtered owner book.
- Forecast category is visible, but its relationship to risk score is not explained in context.

## 5. Proposed Experience

Add a full-page `Risk Detail View` reachable from the dashboard. The page focuses on a scatter plot that compares opportunity risk against deal value, supported by a compact deal detail panel and visible risk explanations.

### User Flow

1. User opens the risk detail view from the dashboard.
2. User reviews a scatter plot of visible opportunities, with risk score on one axis and deal amount on the other.
3. User filters by owner and reviews the highest-risk deals in a companion detail list.
4. User selects a plotted deal to inspect the risk reasons and source fields.
5. User returns to the dashboard overview without losing the overall local app flow.

### UX Requirements

- The feature must be understandable without training.
- Risk outputs must expose the reason they were produced.
- Owner filters must apply consistently to metrics, opportunities, accounts, and tasks.
- The view should support fast scanning and comparison rather than marketing-style presentation.
- Labels and explanations must not rely on color alone.

## 6. Functional Requirements

| ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| FR-1 | Add a full-page risk detail view reachable from the dashboard | Must | Use a hash route such as `#/risk` to preserve the no-build single-page app shape. |
| FR-2 | Show one row/card per visible opportunity with core deal details | Must | Include risk score, label, forecast, stage, amount, weighted amount, probability, close date, account, owner, activity age, contact coverage, account health, and next step. |
| FR-3 | Show user-facing risk reasons for each opportunity | Must | Reasons should come from reusable logic in `src/crm.js`. |
| FR-4 | Preserve owner filtering behavior on the risk detail view | Must | Same owner list and semantics as dashboard overview. |
| FR-5 | Provide a scatter plot for risk-focused comparison | Must | Plot risk score against deal amount; include accessible text equivalents in the detail list. |
| FR-6 | Show summary counts for visible risk distribution | Should | Example: Critical, High, Medium, Low counts. |
| FR-7 | Provide a compact detail list sorted by highest risk by default | Should | Use amount descending as the tie-breaker. |
| FR-8 | Allow users to inspect expanded deal context | Could | Defer contacts, open tasks, and recent activities unless needed after the first implementation. |

## 7. Data Requirements

### Inputs

- Opportunity fields: `stage`, `amount`, `probability`, `closeDate`, `nextStep`, `lastActivityDays`, `contactCoverage`
- Account fields: `name`, `owner`, `health`
- Derived values: `weightedAmount`, `riskScore`, `riskLabel`, `forecastCategory`
- Optional context: account contacts, tasks, and activities

### Outputs

- Risk-versus-amount scatter plot points
- Risk detail rows or cards
- Risk score and label
- Forecast category
- Risk reason list
- Owner-filtered risk distribution summary
- Detail list sort state

### Data Shape Changes

No fixture changes are required for the first version. Expanded account context is deferred; existing `contacts`, `tasks`, and `activities` fields remain available for a later iteration.

## 8. Business Logic

Reuse the current deterministic scoring rules. Add explainability metadata that mirrors the existing scoring calculation.

### Rules

1. Activity staleness: add risk reason when `lastActivityDays` crosses the existing 7, 14, or 21 day thresholds.
2. Missing next step: add risk reason when `nextStep.trim()` is empty.
3. Low contact coverage: add risk reason when `contactCoverage < 2`.
4. Close-date pressure: add risk reason when close date is within 21 days and stage is not `Negotiation`.
5. Large deal: add risk reason when `amount >= 100000`.
6. Account health: add risk reason when account health is `Watch` or `At Risk`.
7. Forecast category: continue using the existing category rules: high risk first, then strong negotiation commit, then probability-based best case or pipeline.

### Explainability

Each risk reason should include:

- A short user-facing label.
- The contributing point value.
- The source field value.
- A plain-English explanation.

Example:

```json
{
  "label": "Stale activity",
  "points": 18,
  "source": "18 days since last activity",
  "reason": "No recent activity in the last 14 days."
}
```

## 9. Edge Cases

- Empty owner book after filtering
- Opportunities with stale activity but strong account health
- Healthy accounts with high-risk opportunities
- Multiple reasons contributing to one risk score
- Deals with no risk reasons and a low score
- Missing optional account context for expanded details

## 10. Success Metrics

### Product Metrics

- Users can identify the highest-risk deal in an owner book without opening every card.
- Users can identify the top reasons behind a deal score from the full-page view.
- Owner filtering produces consistent visible records and summaries.

### Quality Metrics

- Calculation behavior is covered by tests in `test/crm.test.js`.
- Dashboard and risk detail view load successfully through `npm run dev`.

## 11. Rollout Plan

### Release Scope

First release should include the full-page risk detail view, owner filtering, risk-versus-amount scatter plot, highest-risk detail list, risk distribution summary, and visible risk reasons.

### Dependencies

- Existing CRM fixture data.
- Existing deterministic scoring and forecast functions.
- Browser DOM rendering in `src/main.js`.

### Risks

- Risk reason logic diverges from score logic: mitigate by generating score and reasons from the same reusable function.
- View becomes too dense: mitigate with clear columns, compact controls, and expandable details if needed.
- Navigation adds complexity: mitigate with a simple no-build approach that matches the current static architecture.

## 12. Testing Plan

### Automated Tests

- Add tests for risk reason generation.
- Add tests that enriched opportunities include risk explanations.
- Add tests for owner-filtered risk distribution if added.
- Preserve existing risk scoring and forecast category tests.

### Manual Verification

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the dashboard loads.
4. Open the risk detail view.
5. Verify owner filtering affects the risk detail view.
6. Verify sorting and empty states.
7. Verify each calculated risk reason is visible and understandable.

## 13. Open Questions

- Should scatter plot point size also encode amount, or is amount on the axis enough?
- Should the selected deal detail panel open by default on the highest-risk visible deal?
- Should the view include a simple "as of" date note for risk calculations because the current scoring date is fixed?

## 14. Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Initial feature draft created | Codex | Based on current dashboard behavior and repo guidelines. |
| 2026-06-10 | Primary visualization will be a scatter plot | User | Plot risk against deal details, starting with risk score versus amount. |
| 2026-06-10 | Use `#/risk` hash route | Codex | Keeps the app no-build and avoids a second HTML entrypoint. |
| 2026-06-10 | Show point values and explanations | Codex | Best supports explainability for deterministic scoring. |
| 2026-06-10 | Defer expanded account context from version one | Codex | Keeps the first release focused on risk visualization and reasons. |
| 2026-06-10 | Default detail ordering is highest risk | Codex | Use risk score descending, then amount descending. |
