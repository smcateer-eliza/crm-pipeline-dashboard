# Technical Requirements

## 1. Overview

### Feature Name

ELI-808: Add deal risk explanation chips

### Related PRD

`features/ELI-808-deal-risk-explanation-chips/01_Product_Requirements.md`

### Summary

Add deterministic risk reason metadata in `src/crm.js`, attach it to enriched opportunities, and render sorted explanation chips on opportunity cards without changing the existing score or label calculations.

## 2. Architecture Fit

### Affected Areas

- `data/crm.json`: no data-shape changes expected.
- `src/crm.js`: add reusable risk reason generation and attach metadata in `enrichOpportunities`.
- `src/main.js`: render explanation chips for Medium/High/Critical cards and low-risk empty-state text.
- `src/styles.css`: add compact chip and subdued empty-state styling.
- `test/crm.test.js`: add focused tests for reason metadata, sorting, copy, and integration with enriched opportunities.

### Constraints

- Preserve the static, client-side dashboard architecture.
- Do not introduce network-dependent runtime behavior.
- Preserve the no-build setup.
- Keep reusable sales-operations logic in `src/crm.js`.
- Keep scoring deterministic and explainable.
- Do not change existing risk labels or forecast category behavior.

## 3. Data Model

### Existing Inputs

- `lastActivityDays`: number of days since last activity.
- `nextStep`: captured sales next step; empty or whitespace-only means missing.
- `contactCoverage`: count of covered contacts/stakeholders.
- `closeDate`: opportunity close date.
- `stage`: opportunity stage.
- `amount`: opportunity amount in dollars.
- `account.health`: account health label.

### New or Changed Inputs

No new fixture inputs are required.

| Field | Type | Required | Source | Notes |
| --- | --- | --- | --- | --- |
| N/A | N/A | N/A | N/A | Existing data supports the feature. |

### Derived Values

| Value | Calculation | Owner Filter Aware | Explainability Required |
| --- | --- | --- | --- |
| `riskReasons` | Deterministic score-contributor mapping sorted by `scoreImpact` descending | Yes, through enriched opportunities filtered by owner | Yes |
| `riskReason.label` | User-facing explanation of the triggering condition | Yes | Yes |
| `riskReason.scoreImpact` | Numeric contribution from scoring rule | Yes | Yes |
| `riskReason.source` | Driver category such as `activity` or `accountHealth` | Yes | Yes |

Recommended reason shape:

```js
{
  label: "Account health: At Risk",
  scoreImpact: 24,
  source: "accountHealth"
}
```

Allowed `source` values:

- `activity`
- `nextStep`
- `contacts`
- `closeDate`
- `amount`
- `accountHealth`

## 4. Business Logic Requirements

### Deterministic Rules

1. Activity staleness:
   - `lastActivityDays >= 21`: score impact 30.
   - `lastActivityDays >= 14`: score impact 18.
   - `lastActivityDays >= 7`: score impact 8.
2. Missing next step:
   - Empty trimmed `nextStep`: score impact 24.
3. Contact coverage:
   - `contactCoverage < 2`: score impact 16.
4. Close-date pressure:
   - `daysUntil(closeDate) <= 21` and stage is not `Negotiation`: score impact 12.
5. Deal size:
   - `amount >= 100000`: score impact 10.
6. Account health:
   - `Watch`: score impact 12.
   - `At Risk`: score impact 24.
   - `Healthy`: score impact 0.

### Forecast and Risk Behavior

- Forecast categories must remain one of `Commit`, `Best Case`, `Pipeline`, or `At Risk`.
- Risk labels must remain `Low`, `Medium`, `High`, or `Critical`.
- Existing risk-score calculations should not change.
- Account health and opportunity risk must remain separate concepts in copy and metadata.

### Explainability

Each reason must include:

- Triggering condition
- User-facing label
- Score contribution
- Source/type metadata

Close-date copy should avoid the original hard-to-parse wording. Preferred labels:

- `Closing soon before Negotiation`
- or `Close date within 21 days and not in Negotiation`

Account-health copy should be source-labeled:

- `Account health: Watch`
- `Account health: At Risk`

## 5. UI Requirements

### Rendering Changes

- Opportunity cards display explanation chips for Medium, High, and Critical deals.
- Low-risk cards show subdued text: `No major risk drivers`.
- Chips render in the sorted order provided by business logic.
- Chip text must fit within the card layout at supported viewport sizes.

### Interaction Rules

- Owner filters must continue to affect pipeline metrics, opportunities, accounts, and tasks consistently.
- Explanation metadata should follow the opportunity; no separate UI-only recomputation in `src/main.js`.
- The low-risk empty state should not be styled as an alert.

## 6. Error and Edge Case Handling

- Missing or unknown `account.health` should not create a reason.
- Whitespace-only `nextStep` should count as missing.
- A Negotiation-stage deal closing within 21 days should not get the close-date reason.
- Low-risk deals with no rendered reasons should show the empty-state text.
- Empty filtered books should not throw rendering errors.

## 7. Performance Requirements

- Calculations should run in memory against the local fixture data.
- Reuse enriched opportunity data instead of recalculating reasons in the render layer.
- Sorting reason arrays is acceptable at fixture scale.

## 8. Accessibility Requirements

- Chip text must not rely on color alone to communicate meaning.
- Empty-state text should be readable by assistive technology as normal card content.
- Cards must remain keyboard-scrollable and readable at narrow widths.

## 9. Testing Requirements

### Unit Tests

Add or update tests in `test/crm.test.js` for:

- A reusable reason-generation function, if exported.
- `enrichOpportunities` attaching `riskReasons`.
- Reason metadata includes `label`, `scoreImpact`, and `source`.
- Reasons sort by `scoreImpact` descending.
- Account health reason copy is source-labeled.
- Close-date reason copy is updated.
- Owner filtering remains compatible with enriched opportunities carrying reasons.

### Manual Tests

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the dashboard loads.
4. Verify chips appear on Medium, High, and Critical cards.
5. Verify Low cards show `No major risk drivers`.
6. Verify all owner filter options preserve correct explanations.

## 10. Migration and Compatibility

### Fixture Migration

No fixture migration is expected.

### Backward Compatibility

- Existing opportunity fields remain unchanged.
- Existing `scoreDealRisk`, `riskLabel`, `forecastCategory`, `summarizePipeline`, and owner filtering behavior should remain compatible.
- New metadata is additive on enriched opportunities.

## 11. Security and Privacy

- Do not add external services, API keys, trackers, or remote data loading.
- Do not expose sensitive customer data beyond the local fixture context.
- Keep sample data synthetic.

## 12. Open Technical Questions

- Should `scoreImpact` be displayed in the UI, exposed only in metadata, or hidden entirely from rendering?
- Should source/type eventually map to CSS classes for distinct visual treatment?
- Should low-risk opportunities with minor contributors expose reasons in metadata but suppress them in the UI?

## 13. Technical Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-17 | Add reason metadata as an additive field on enriched opportunities. | Planning | Avoid changing source fixture shape. |
| 2026-06-17 | Sort reasons in business logic before rendering. | Planning | Keeps `src/main.js` focused on display. |
| 2026-06-17 | Do not change score or label thresholds in ELI-808. | Planning | Ticket is explainability-only. |
