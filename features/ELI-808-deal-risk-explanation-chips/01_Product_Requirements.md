# Product Requirements Document

## 1. Overview

### Feature Name

ELI-808: Add deal risk explanation chips

### Summary

Show deterministic, human-readable reasons behind each opportunity risk score so sales managers can quickly understand why a deal is flagged and where to focus follow-up.

### Background

The current dashboard already calculates opportunity risk scores and risk labels in `src/crm.js`, then renders those labels on opportunity cards. Sales managers can see that a deal is Low, Medium, High, or Critical risk, but they cannot see the drivers behind that label without knowing the scoring rules.

The Linear ticket asks for explanation chips on opportunity cards. The Granola meeting "Pipeline CRM: Deal Risk Convo" added several clarifications: chips should be sorted by scoring impact, reason metadata should include source/type, low-risk cards should show a quiet positive empty state, account health reasons should be source-labeled, and close-date copy should be clearer.

## 2. Goals

### Business Goals

- Help sales managers prioritize risky deals with explainable risk drivers.
- Improve trust in deterministic pipeline scoring by exposing the inputs behind each risk label.
- Preserve the existing simple forecast and risk model without adding external services.

### User Goals

- As a sales manager, I can see why a deal is marked risky without reverse-engineering the score.
- As a sales manager, I can compare risk drivers in priority order.
- As RevOps, I can explain the score using stable, testable rules.

### Non-Goals

- Do not change existing risk score thresholds or risk labels.
- Do not introduce AI-generated recommendations or next-best-action logic.
- Do not add remote CRM integrations, external services, or API-key dependencies.
- Do not decide advanced visual treatment by reason type in this ticket.

## 3. Users and Use Cases

### Primary Users

- Sales managers
- Account executives
- Revenue operations

### Key Use Cases

1. A sales manager reviews open opportunities and needs to understand the top reasons a deal is risky so they can coach the owner.
2. An account executive reviews their owner-filtered book and needs to see which specific hygiene gaps are contributing to risk.
3. RevOps reviews scoring behavior and needs deterministic metadata that can be tested and explained.

## 4. Current Experience

Opportunity cards show a risk label and score, such as High risk and 68. The card also shows opportunity details like next step, account, stage, amount, and weighted amount.

### Pain Points

- Risk labels are visible but not explainable in the UI.
- Users cannot tell whether account health, stale activity, contact coverage, close-date pressure, or deal size drove the score.
- Existing close-date reason wording from the ticket is hard to parse.
- The absence of chips on low-risk deals could look like missing data rather than an intentional positive state.

## 5. Proposed Experience

Opportunity cards render compact explanation chips for Medium, High, and Critical risk deals. Chips are sorted by score impact descending, so the most important risk driver appears first. Low-risk cards do not render risk chips, but show subdued text: "No major risk drivers."

### User Flow

1. User opens the dashboard and reviews Open Opportunities.
2. User scans a card's risk label and explanation chips.
3. User reads the first chip as the highest-impact driver.
4. User applies an owner filter and sees the same explanation behavior for the filtered book.

### UX Requirements

- Explanation chips must be understandable without training.
- Chip order must reflect scoring contribution, highest impact first.
- Low-risk empty state must be quiet and not look like an alert.
- Account-health explanations must clearly identify account health as the source.
- Existing risk labels must remain unchanged.

## 6. Functional Requirements

| ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| FR-1 | Enriched opportunities expose risk explanation metadata. | Must | Each reason includes `label`, `scoreImpact`, and `source`. |
| FR-2 | Explanation metadata is generated deterministically from the same inputs used by risk scoring. | Must | No UI-only special cases for business rules. |
| FR-3 | Explanation reasons are sorted by `scoreImpact` descending. | Must | Highest scoring contribution first. |
| FR-4 | Medium, High, and Critical risk deals render explanation chips. | Must | Existing risk labels and scores remain unchanged. |
| FR-5 | Low-risk deals render "No major risk drivers" when no explanation should be shown. | Must | This is subdued text, not a chip. |
| FR-6 | Account health reasons use source-labeled copy. | Must | Example: `Account health: At Risk`. |
| FR-7 | Close-date reason copy is clear and action-oriented. | Must | Prefer `Closing soon before Negotiation` or equivalent. |
| FR-8 | Owner filtering continues to apply consistently. | Must | Filtered cards retain correct explanation metadata. |

## 7. Data Requirements

### Inputs

- `opportunity.lastActivityDays`
- `opportunity.nextStep`
- `opportunity.contactCoverage`
- `opportunity.closeDate`
- `opportunity.stage`
- `opportunity.amount`
- `account.health`

### Outputs

- `opportunity.riskReasons`: array of reason metadata
- Low-risk card empty-state text: `No major risk drivers`

### Data Shape Changes

No `data/crm.json` shape changes are expected for this feature. Existing fixture fields already support the risk drivers.

Example derived reason:

```json
{
  "label": "Account health: At Risk",
  "scoreImpact": 24,
  "source": "accountHealth"
}
```

## 8. Business Logic

Reason generation should mirror the existing risk-score contributors:

1. Stale activity: explain when `lastActivityDays` contributes risk.
2. Missing next step: explain when `nextStep` is empty after trimming.
3. Contact coverage: explain when `contactCoverage` is below 2.
4. Close-date pressure: explain when the deal closes within 21 days and is not in Negotiation.
5. Large deal: explain when `amount` is at least 100000.
6. Account health: explain when account health contributes risk.

### Explainability

Every rendered chip must describe the triggering condition in plain language and carry its source/type. Account health and opportunity risk remain related but separate concepts, so account-health copy must identify itself as account-driven.

## 9. Edge Cases

- Low-risk deal with no visible reasons
- Low-risk deal with one minor scoring contributor
- Missing or whitespace-only next step
- Account health values outside the known scoring map
- Close date within 21 days while already in Negotiation
- Owner filter hides all deals for a selected owner

## 10. Success Metrics

### Product Metrics

- Sales managers can identify the top risk driver from the first chip on each risky card.
- Low-risk cards communicate intentional lack of major drivers.

### Quality Metrics

- Calculation behavior is covered by tests in `test/crm.test.js`.
- Dashboard loads successfully through `npm run dev`.

## 11. Rollout Plan

### Release Scope

Ship deterministic risk explanation metadata, sorted chips on opportunity cards, and the low-risk empty-state message.

### Dependencies

- Existing risk scoring logic in `src/crm.js`
- Existing opportunity card rendering in `src/main.js`
- Existing owner filter behavior

### Risks

- Reason labels drift from score logic: mitigate by generating reasons from the same scoring thresholds.
- Chips make cards too dense: mitigate with compact styling and subdued low-risk text.
- Account health appears to be an opportunity-only problem: mitigate with source-labeled copy.

## 12. Testing Plan

### Automated Tests

- Add tests for reason metadata shape.
- Add tests for descending score-impact sorting.
- Add tests for source/type tagging.
- Add tests for account-health copy.
- Add tests for close-date copy.
- Add tests that enriched opportunities include reasons without breaking owner filtering.

### Manual Verification

1. Run `npm test`.
2. Run `npm run dev`.
3. Verify the dashboard loads.
4. Verify Medium, High, and Critical cards show explanation chips.
5. Verify Low cards show `No major risk drivers`.
6. Verify owner filtering preserves correct card explanations.

## 13. Open Questions

- Should the UI display numeric score impact, or only use it for sorting?
- Should chips have different visual treatments by source/type?
- Should a low-risk deal with one minor reason show that chip, or only the quiet empty-state message?

## 14. Decision Log

| Date | Decision | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-17 | Use explanation chips for Medium, High, and Critical deals without changing risk labels. | Linear ELI-808 | Initial ticket scope. |
| 2026-06-17 | Sort chips by scoring impact descending. | Pipeline CRM: Deal Risk Convo | Highest-impact reason first. |
| 2026-06-17 | Add low-risk empty state: `No major risk drivers`. | Pipeline CRM: Deal Risk Convo | Quiet text, not a chip. |
| 2026-06-17 | Include `label`, `scoreImpact`, and `source` on each reason. | Pipeline CRM: Deal Risk Convo | Source values include activity, nextStep, contacts, closeDate, amount, accountHealth. |
