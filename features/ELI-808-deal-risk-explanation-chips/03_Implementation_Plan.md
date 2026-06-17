# Implementation Plan

## 1. Overview

### Feature Name

ELI-808: Add deal risk explanation chips

### Related Documents

- PRD: `features/ELI-808-deal-risk-explanation-chips/01_Product_Requirements.md`
- Technical Requirements: `features/ELI-808-deal-risk-explanation-chips/02_Tech_Requirements.md`

### Implementation Summary

Add deterministic risk reason generation in `src/crm.js`, attach sorted reason metadata to enriched opportunities, render reason chips or low-risk empty-state text in `src/main.js`, and style the result in `src/styles.css`. Validate the behavior with focused `test/crm.test.js` coverage before touching UI implementation.

## 2. Assumptions

- This feature is explainability-only; risk scoring, labels, and forecast categories remain unchanged.
- Existing fixture data is sufficient.
- `scoreImpact` is required in metadata but is not shown in the first UI pass unless the open question is resolved differently.
- Source/type-specific visual treatment is deferred unless explicitly requested before implementation.

## 3. Work Breakdown

### Phase 1: Data and Fixtures

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Confirm no fixture shape change is needed | Codex | Not Started | Existing fields cover all risk reasons. |
| Identify fixture examples for each reason type | Codex | Not Started | Use current `data/crm.json` where possible; test fixtures can fill gaps. |

### Phase 2: Business Logic

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add reusable reason-generation logic in `src/crm.js` | Codex | Not Started | Likely export a function for direct tests. |
| Attach `riskReasons` in `enrichOpportunities` | Codex | Not Started | Reasons should be sorted descending by impact. |
| Keep score logic behavior unchanged | Codex | Not Started | Tests should detect accidental score drift. |
| Ensure owner filters remain compatible | Codex | Not Started | Filtering should not alter reason metadata. |

### Phase 3: UI Rendering

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Render chips on Medium/High/Critical cards | Codex | Not Started | Consume `opportunity.riskReasons`. |
| Render low-risk empty state | Codex | Not Started | Text: `No major risk drivers`. |
| Add compact chip styling | Codex | Not Started | Must handle longer account-health copy. |
| Check responsive card layout | Codex | Not Started | Prevent chip text overflow. |

### Phase 4: Testing and Verification

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add tests before production changes | Codex | Not Started | Follow repo rule: tests first for feature work. |
| Run `npm test` and confirm new tests pass after implementation | Codex | Not Started | Expected final verification. |
| Run `npm run dev` and verify dashboard load | Codex | Not Started | Browser is already available at local app URL. |
| Verify owner filter behavior in browser | Codex | Not Started | Check all owners and selected-owner views. |

## 4. Detailed Steps

1. Add failing tests in `test/crm.test.js` for the desired reason metadata behavior.
2. Implement a reusable reason-generation helper in `src/crm.js`.
3. Update `enrichOpportunities` to include sorted `riskReasons`.
4. Run `npm test` to verify business logic.
5. Update opportunity-card rendering in `src/main.js`.
6. Add compact styles in `src/styles.css`.
7. Run `npm test` again.
8. Run `npm run dev`.
9. Verify in the in-app browser:
   - High/Medium cards show sorted chips.
   - Low cards show `No major risk drivers`.
   - Owner filtering preserves explanations.
10. Document any unresolved UI decisions as follow-up.

## 5. Test Plan

### Automated Checks

```bash
npm test
```

Expected result:

- All existing CRM business logic tests pass.
- New tests cover reason metadata shape, sorting, source tagging, close-date copy, account-health copy, and enriched-opportunity integration.

### Local App Verification

```bash
npm run dev
```

Expected result:

- Dashboard loads without console-breaking errors.
- Medium, High, and Critical cards show explanation chips.
- Low cards show subdued `No major risk drivers` text.
- Owner filters update visible opportunities and preserve correct explanations.

## 6. Acceptance Criteria

- Each enriched opportunity exposes risk explanation metadata with `label`, `scoreImpact`, and `source`.
- Explanation chips are sorted by `scoreImpact` descending.
- Medium, High, and Critical deals show contributing risk explanation chips.
- Low-risk deals show a quiet `No major risk drivers` message when no explanation applies.
- Account-health explanations are clearly labeled as account-driven.
- Close-date explanation copy is clearer than the original ticket wording.
- Owner filtering still works consistently.
- `npm test` passes.
- Dashboard loads through `npm run dev`.

## 7. Rollback Plan

- Revert reason-generation changes in `src/crm.js`.
- Revert opportunity-card rendering changes in `src/main.js`.
- Revert chip styling in `src/styles.css`.
- Revert or adjust tests if the feature is deferred.
- No fixture rollback expected.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Explanation logic diverges from score logic | Users see misleading reasons | Keep thresholds co-located and test score-impact values. |
| Card UI becomes noisy | Managers scan less effectively | Render chips only for Medium/High/Critical and use subdued low-risk text. |
| Source labels are unclear | Account health appears like opportunity-only risk | Use explicit account-health copy and source metadata. |
| Open UI questions slow implementation | Scope creep | Keep numeric impact and source-specific visuals out of v1 unless decided. |

## 9. Dependencies

- Linear ticket `ELI-808`
- Granola meeting `Pipeline CRM: Deal Risk Convo` from 2026-06-17
- Existing CRM scoring logic in `src/crm.js`

## 10. Open Questions

- Should numeric score impact be visible in the chip UI?
- Should chips have source-specific visual treatments?
- Should low-risk deals with one minor reason show that reason or only the empty-state message?

## 11. Progress Log

| Date | Update | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-17 | Created feature planning docs from Linear and Granola context. | Codex | No production code changes. |
