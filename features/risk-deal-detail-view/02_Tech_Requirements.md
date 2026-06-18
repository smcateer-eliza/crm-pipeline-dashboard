# Technical Requirements

## 1. Overview

### Feature Name

`Risk vs Deal Detail View`

### Related PRD

`features/risk-deal-detail-view/01_Product_Requirements.md`

### Summary

Add a full-page risk analysis view to the static CRM dashboard. The implementation should reuse existing CRM enrichment logic, add explainable risk-driver metadata, and render an owner-aware scatter plot plus ranked opportunity detail records without adding external services or a build step.

## 2. Architecture Fit

### Affected Areas

- `data/crm.json`: No required first-version data-shape changes.
- `src/crm.js`: Add reusable risk-driver logic and optional risk-view summary helpers.
- `src/main.js`: Add navigation/view rendering or support a separate page script.
- `src/styles.css`: Add responsive risk-view layout, visualization, and detail styling.
- `index.html`: Add navigation entry point if using a single app shell.
- `test/crm.test.js`: Add coverage for risk-driver explainability and any new summaries.

### Constraints

- Preserve the static, client-side dashboard architecture.
- Do not introduce network-dependent runtime behavior.
- Preserve the no-build setup unless explicitly justified.
- Keep reusable sales-operations logic in `src/crm.js`.
- Use native browser rendering for the scatter plot rather than adding a charting dependency.

## 3. Data Model

### Existing Inputs

- `opportunity.amount`: Total deal value.
- `opportunity.probability`: Forecast probability percentage.
- `opportunity.stage`: Sales stage.
- `opportunity.closeDate`: Expected close date.
- `opportunity.nextStep`: Captured next action.
- `opportunity.lastActivityDays`: Age of most recent activity.
- `opportunity.contactCoverage`: Number of contacts covered on the deal.
- `account.owner`: Account owner used for filtering.
- `account.health`: Account-level health signal.

### New or Changed Inputs

| Field | Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| None for V1 | N/A | No | N/A | Existing fields are sufficient for first-version risk explanations. |

### Derived Values

| Value | Calculation | Owner Filter Aware | Explainability Required |
| --- | --- | --- | --- |
| `riskDrivers` | Individual contributors from current `scoreDealRisk` rules | Yes, through opportunity filtering | Yes |
| `riskValuePosition` | `riskScore` plus raw `amount` for scatter plot placement | Yes | No, but axes must be labeled |
| `riskSummary` | Counts by risk label, forecast category, or quadrant | Yes | Should show source counts |

## 4. Business Logic Requirements

### Deterministic Rules

1. `Activity age driver`: Add the same point value currently used for stale activity thresholds.
2. `Missing next step driver`: Add 24 points when `nextStep.trim()` is empty.
3. `Contact coverage driver`: Add 16 points when contact coverage is below 2.
4. `Close-date pressure driver`: Add 12 points when close date is within 21 days and stage is not `Negotiation`.
5. `Large deal driver`: Add 10 points when amount is at least 100000.
6. `Account health driver`: Add 0, 12, or 24 based on account health.
7. `Score cap`: Continue capping final risk score at 100.

### Forecast and Risk Behavior

- Forecast categories must remain one of `Commit`, `Best Case`, `Pipeline`, or `At Risk`.
- Risk labels should identify deals needing attention without flagging every imperfect deal.
- Account health and opportunity risk must remain separate concepts, even when account health contributes to opportunity risk.
- Risk-driver output must stay aligned with the risk score calculation.

### Explainability

Each risk-driver item should include:

- A stable driver ID, such as `stale-activity`.
- User-facing label.
- Source field or fields.
- Point contribution.
- Plain-English reason.

## 5. UI Requirements

### Rendering Changes

- Add navigation from the existing dashboard to the risk view.
- Render a full-page scatter plot that compares opportunity risk and raw deal amount.
- Render ranked deal details alongside or below the visualization.
- Render risk-driver chips or a compact driver list for each selected or visible deal.
- Render zero or empty states for no matching opportunities.

### Interaction Rules

- Owner filters must affect the visualization, detail records, and any risk summaries.
- If scatter plot points can be selected in V1, selection must be keyboard-accessible.
- If the visualization uses color, labels or text must also communicate risk category.
- The risk view should remain usable on mobile viewports, likely by stacking visualization and details.

## 6. Error and Edge Case Handling

- Missing optional CRM fields should not break dashboard rendering.
- Missing account links should produce a safe fallback rather than throwing.
- Missing required scoring fields should default conservatively and be covered by tests.
- Empty filtered books should show zeroed summaries and no deal-detail rows.
- Multiple risk drivers should be displayed without overflowing compact cards.

## 7. Performance Requirements

- Calculations should run in memory against the local fixture data.
- Derived risk-driver data should be computed once per render, not repeatedly inside nested loops.
- Rendering should remain responsive for a fixture expanded to dozens of opportunities.

## 8. Accessibility Requirements

- Navigation and any deal selection controls must be keyboard-accessible.
- Risk labels must be visible as text, not only color.
- Scatter plot points must have accessible labels describing deal name, risk score, raw amount, and forecast category.
- Text must remain readable on desktop and mobile.

## 9. Testing Requirements

### Unit Tests

Add or update tests in `test/crm.test.js` for:

- Risk-driver generation for stale activity, missing next step, low contact coverage, close-date pressure, large deals, and account health.
- Risk-driver point totals aligning with the risk score before capping.
- Capped score behavior when driver totals exceed 100.
- Owner-filter behavior for any new risk-view summary helper.

### Manual Tests

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the overview dashboard loads.
4. Verify navigation to the risk view.
5. Verify the risk view works with all owners selected.
6. Verify the risk view works with each individual owner selected.
7. Verify risk-driver text matches the displayed score and label.

## 10. Migration and Compatibility

### Fixture Migration

No first-version fixture migration is required. The current fixture has all fields needed for the proposed view and driver explanations.

### Backward Compatibility

- Existing `enrichOpportunities` output should remain compatible with current UI rendering.
- Existing tests should continue to pass.
- Existing `/api/crm` response shape should remain valid.

## 11. Security and Privacy

- Do not add external services, API keys, trackers, or remote data loading.
- Do not expose sensitive customer data beyond the local synthetic fixture context.
- Keep all calculations client-side and deterministic.

## 12. Open Technical Questions

- Should risk-driver generation be part of `scoreDealRisk`, a sibling helper, or `enrichOpportunities`?
- Should the full-page app-shell view use a hash route, hidden sections, or another static-friendly route mechanism?
- Should scatter plot points be selectable in V1, and if so should selected deal state be encoded in the URL?
- Should the scatter plot include reference bands for risk labels and amount tiers?

## 13. Technical Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Preserve no-build, local-first architecture for the risk view. | Codex | First draft assumption; awaiting user confirmation. |
| 2026-06-10 | Use native scatter plot visualization with raw deal amount on the value axis. | User/Codex | User chose scatter plot; Codex recommendation chose raw amount. |
| 2026-06-10 | Implement as a full-page view inside the existing static app shell. | Codex | Recommended to keep navigation simple and preserve current app shape. |
