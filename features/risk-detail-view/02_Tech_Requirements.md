# Technical Requirements

## 1. Overview

### Feature Name

`Risk Detail View`

### Related PRD

`features/risk-detail-view/01_Product_Requirements.md`

### Summary

Add a no-build, local-first full-page risk analysis view with a risk-versus-amount scatter plot that reuses existing CRM data and deterministic scoring logic. Extend `src/crm.js` to expose risk explanation metadata so UI rendering does not duplicate sales-operations logic.

## 2. Architecture Fit

### Affected Areas

- `data/crm.json`: no required first-version fixture changes.
- `src/crm.js`: add reusable risk explanation and optional risk distribution helpers.
- `src/main.js`: add hash-route view rendering, scatter plot rendering, risk detail rendering, owner filter consistency, and detail ordering behavior.
- `src/styles.css`: add responsive full-page risk view styles.
- `index.html`: add navigation affordance and risk detail containers if using an in-page view switch.
- `test/crm.test.js`: add coverage for explanation metadata and any new summary helpers.

### Constraints

- Preserve the static, client-side dashboard architecture.
- Do not introduce network-dependent runtime behavior.
- Preserve the no-build setup unless explicitly justified.
- Keep reusable sales-operations logic in `src/crm.js`.
- Keep `src/main.js` focused on browser events and rendering.

## 3. Data Model

### Existing Inputs

- `opportunity.lastActivityDays`: activity staleness signal.
- `opportunity.nextStep`: next action completeness signal.
- `opportunity.contactCoverage`: stakeholder coverage signal.
- `opportunity.closeDate`: close-date pressure signal.
- `opportunity.stage`: sales stage and negotiation readiness signal.
- `opportunity.amount`: deal size signal.
- `opportunity.probability`: weighted pipeline and forecast signal.
- `account.health`: account-level health signal kept separate from opportunity risk.
- `account.owner`: owner filtering signal.

### New or Changed Inputs

| Field | Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| None | N/A | No | N/A | First version should use existing fixture shape. |

### Derived Values

| Value | Calculation | Owner Filter Aware | Explainability Required |
| --- | --- | --- | --- |
| `riskReasons` | Same conditions and point values used by `scoreDealRisk` | Yes, through filtered opportunities | Yes |
| `riskDistribution` | Count visible opportunities by risk label | Yes | No, labels already derive from score |
| `riskPlotPoints` | Map visible enriched opportunities into scatter plot coordinates and labels | Yes | Yes, through selected deal details |
| `sortedRiskOpportunities` | Sort enriched opportunities by highest risk by default | Yes | No |

## 4. Business Logic Requirements

### Deterministic Rules

1. Score and explanations must be generated from the same rule definitions or helper path.
2. Risk score must remain capped at `100`.
3. Risk labels must remain `Low`, `Medium`, `High`, and `Critical`.
4. Forecast categories must remain `Commit`, `Best Case`, `Pipeline`, and `At Risk`.
5. Owner filtering must use account owner, matching existing `filterByOwner`.

### Forecast and Risk Behavior

- Forecast categories must remain one of `Commit`, `Best Case`, `Pipeline`, or `At Risk`.
- Risk labels should identify deals needing attention without flagging every imperfect deal.
- Account health and opportunity risk must remain separate concepts, even when account health contributes to the opportunity risk score.

### Explainability

Each risk reason must include:

- Triggering condition.
- User-facing reason.
- Source data used.
- Point contribution.

Suggested shape:

```js
{
  id: "activity-14",
  label: "Stale activity",
  points: 18,
  source: "18 days since last activity",
  reason: "No recent activity in the last 14 days."
}
```

## 5. UI Requirements

### Rendering Changes

- Dashboard displays a navigation control to open the `#/risk` detail view.
- Risk detail view displays owner filter and a highest-risk detail list.
- Risk detail view displays a scatter plot with risk score on one axis and deal amount on the other.
- Risk detail view displays visible opportunity count and optional risk distribution summary.
- Risk detail view displays deal details and risk explanations.
- Risk detail view updates when owner filter changes.

### Interaction Rules

- Owner filters must affect pipeline metrics, opportunities, accounts, tasks, and risk detail records consistently.
- Empty states must be useful and specific.
- Calculated outputs must show enough context for a sales manager to act.
- Default detail ordering should be deterministic: risk score descending, amount descending as tie-breaker.
- Scatter plot points should be selectable and should update the visible detail panel.

## 6. Error and Edge Case Handling

- Missing optional CRM fields should not break dashboard rendering.
- Missing required CRM fields should fall back to a clear default or be covered by fixture validation.
- Empty filtered books should show zeroed metrics and empty lists consistently.
- Deals with no risk reasons should show a positive low-risk explanation such as "No major risk drivers detected."
- Conflicting signals should preserve separate account health and opportunity risk explanations.

## 7. Performance Requirements

- Calculations should run in memory against the local fixture data.
- Rendering should remain responsive for the expected fixture size.
- Avoid repeated expensive calculations inside per-record render loops when a summary can be calculated once.

## 8. Accessibility Requirements

- Navigation, owner filter, scatter plot points, and deal selection controls must be keyboard accessible.
- New status, risk, or category labels must not rely on color alone.
- Risk reasons must be text, not only icons or colors.
- Scatter plot data must have a text equivalent through the detail list.
- The scatter plot and detail list must remain readable on narrow viewports.

## 9. Testing Requirements

### Unit Tests

Add or update tests in `test/crm.test.js` for:

- Risk reason generation for each scoring rule.
- Enriched opportunities carrying risk reasons.
- Risk distribution helper if implemented.
- Scatter plot point derivation if implemented in `src/crm.js`.
- Highest-risk ordering helper if implemented in `src/crm.js`.
- Existing owner filter behavior remains unchanged.

### Manual Tests

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the dashboard loads.
4. Verify the risk detail view works with all owners selected.
5. Verify the risk detail view works with each individual owner selected.
6. Verify scatter plot points render and selecting a point updates deal details.
7. Verify risk reasons align with visible source fields.

## 10. Migration and Compatibility

### Fixture Migration

No migration required for the first version. Existing fixture records already contain enough fields to explain the current risk score.

### Backward Compatibility

- Existing dashboard overview should keep its current metrics and opportunity card behavior unless explicitly changed.
- `/api/crm` response shape should remain backward compatible.
- Static fallback to `data/crm.json` should continue working.

## 11. Security and Privacy

- Do not add external services, API keys, trackers, or remote data loading.
- Do not expose sensitive customer data beyond the local fixture context.
- Keep sample data synthetic unless explicitly approved.

## 12. Open Technical Questions

- Should scatter plot coordinate derivation live in `src/crm.js` for testability or remain UI-only in `src/main.js`?
- Should the selected deal detail panel default to the highest-risk visible deal?
- Should the current fixed scoring date remain unchanged, or should this feature expose "as of" context to avoid date confusion?

## 13. Technical Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Initial technical requirements drafted | Codex | First version assumes no data-shape changes. |
| 2026-06-10 | Use hash routing for the full-page view | Codex | `#/risk` keeps the app as a single static entrypoint. |
| 2026-06-10 | Scatter plot is required for version one | User | Risk score versus deal amount is the initial plot model. |
| 2026-06-10 | Point values visible in risk reasons | Codex | Supports auditability and explainability. |
| 2026-06-10 | Expanded account context deferred | Codex | Avoids widening first-release scope. |
