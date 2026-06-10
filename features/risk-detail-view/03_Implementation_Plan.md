# Implementation Plan

## 1. Overview

### Feature Name

`Risk Detail View`

### Related Documents

- PRD: `features/risk-detail-view/01_Product_Requirements.md`
- Technical Requirements: `features/risk-detail-view/02_Tech_Requirements.md`

### Implementation Summary

Implement a full-page risk analysis view using the existing no-build frontend and FastAPI/static serving flow. Add reusable risk explanation logic to `src/crm.js`, test it, then render an owner-filtered risk-versus-amount scatter plot with a highest-risk detail list in `src/main.js`.

## 2. Assumptions

- The feature should ship as part of the existing app rather than a separate service.
- Existing risk thresholds and forecast category rules should remain unchanged for version one.
- Existing CRM fixture fields are sufficient for risk explanations.
- The first release prioritizes scatter plot comparison and explainability over editing CRM data.

## 3. Work Breakdown

### Phase 1: Product Decisions

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Decide navigation model | Codex | Decided | Use `#/risk` hash route. |
| Decide primary visualization | User | Decided | Scatter plot. |
| Decide visible explanation depth | Codex | Decided | Show both point values and plain-English reasons. |

### Phase 2: Data and Fixtures

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Confirm no fixture changes needed | Codex | Not Started | Existing fields appear sufficient. |
| Add edge-case fixture records only if needed | Codex | Not Started | Optional if tests need more representative examples. |

### Phase 3: Business Logic

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add reusable risk reason logic in `src/crm.js` | Codex | Not Started | Keep score and reasons aligned. |
| Update `enrichOpportunities` to include reasons | Codex | Not Started | Avoid duplicating logic in UI. |
| Add risk distribution helper if needed | Codex | Not Started | Useful for summary counts. |
| Add optional scatter plot point helper if needed | Codex | Not Started | Improves testability for plotted values. |
| Add optional highest-risk ordering helper if needed | Codex | Not Started | Improves testability for detail ordering. |

### Phase 4: UI Rendering

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add risk detail navigation control | Codex | Not Started | Link to `#/risk`. |
| Render full-page risk detail view | Codex | Not Started | Scatter plot plus detail list. |
| Add owner filter support | Codex | Not Started | Reuse current state where possible. |
| Add default highest-risk detail ordering | Codex | Not Started | Risk desc, amount desc tie-breaker. |
| Add empty and filtered states | Codex | Not Started | Keep consistent with dashboard. |
| Update styles in `src/styles.css` | Codex | Not Started | Responsive and accessible. |

### Phase 5: Testing and Verification

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add or update `test/crm.test.js` coverage | Codex | Not Started | Risk reasons and optional helpers. |
| Run `npm test` | Codex | Not Started | Required before handoff. |
| Run `npm run dev` and verify dashboard load | Codex | Not Started | Required for UI changes. |
| Verify in-app browser behavior | Codex | Not Started | Especially navigation and filtering. |

## 4. Detailed Steps

1. Confirm final scatter plot interaction details with the user if needed.
2. Add a risk rule representation or helper in `src/crm.js` so score and reasons stay aligned.
3. Update `scoreDealRisk` or create a shared internal helper to avoid duplicate scoring conditions.
4. Include `riskReasons` in `enrichOpportunities`.
5. Add unit tests for each risk reason and existing score behavior.
6. Add `#/risk` hash navigation in `index.html` and `src/main.js`.
7. Render the risk detail view with owner filtering, scatter plot, and highest-risk detail list.
8. Add styles for desktop and narrow viewport layouts.
9. Run `npm test`.
10. Run `npm run dev`.
11. Verify the dashboard and risk detail view in the in-app browser.

## 5. Test Plan

### Automated Checks

```bash
npm test
```

Expected result:

- All existing CRM business logic tests pass.
- New tests cover risk reasons and any new helper functions.

### Local App Verification

```bash
npm run dev
```

Expected result:

- Dashboard loads without console-breaking errors.
- Risk detail view opens from the dashboard at `#/risk`.
- Owner filters update the risk detail view consistently.
- Scatter plot renders visible opportunities.
- Highest-risk detail list orders visible opportunities deterministically.
- Risk reasons match displayed source fields.

## 6. Acceptance Criteria

- User can open a full-page risk detail view from the dashboard.
- User can compare visible opportunities in a risk-versus-amount scatter plot.
- Each deal shows risk score, risk label, forecast category, and risk reasons.
- Owner filter applies consistently on the risk detail view.
- Risk explanation logic is tested and lives in `src/crm.js`.
- Existing dashboard behavior remains intact.

## 7. Rollback Plan

- Revert risk explanation changes in `src/crm.js`.
- Revert risk detail rendering and navigation changes in `src/main.js`.
- Revert markup changes in `index.html`.
- Revert styling changes in `src/styles.css`.
- Keep tests only if they still describe supported behavior.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Score and explanation drift apart | Users lose trust in the view | Generate both from shared rule logic. |
| Dense page is hard to scan | Managers do not get faster prioritization | Use a compact comparison layout and clear sorting. |
| Navigation overcomplicates no-build app | More code than feature needs | Use a simple hash route. |
| Date thresholds confuse users | Close-date and overdue behavior feels stale | Consider showing an explicit scoring "as of" date. |

## 9. Dependencies

- Existing `/api/crm` endpoint and static fallback data.
- Existing risk and forecast logic.
- Product decision on final scatter plot interaction details.

## 10. Open Questions

- Should scatter plot point size also encode amount, or is amount on the axis enough?
- Should the selected deal detail panel default to the highest-risk visible deal?
- Should the plot include visual guide bands for Low, Medium, High, and Critical risk thresholds?

## 11. Progress Log

| Date | Update | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Initial feature plan drafted | Codex | Ready for user iteration on open product decisions. |
| 2026-06-10 | Feature direction refined | User/Codex | Scatter plot selected; Codex chose `#/risk`, point values plus explanations, highest-risk default ordering, and deferred expanded account context. |
