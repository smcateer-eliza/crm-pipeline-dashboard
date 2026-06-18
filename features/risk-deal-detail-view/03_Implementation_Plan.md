# Implementation Plan

## 1. Overview

### Feature Name

`Risk vs Deal Detail View`

### Related Documents

- PRD: `features/risk-deal-detail-view/01_Product_Requirements.md`
- Technical Requirements: `features/risk-deal-detail-view/02_Tech_Requirements.md`

### Implementation Summary

Implement a full-page risk analysis view that reuses the existing CRM fixture and enrichment logic, adds deterministic risk-driver explanations, and renders an owner-aware scatter plot with ranked deal details. The first implementation should avoid new dependencies and preserve the existing overview dashboard.

## 2. Assumptions

- The first version should be implemented in the existing static app without introducing a build step.
- The current CRM fixture fields are enough for the first version.
- The existing risk and forecast thresholds should remain unchanged.
- The primary audience is sales managers.
- The visualization will be a native scatter plot rather than a charting library.
- The value axis will use raw deal amount.
- The risk view will live as a full-page view inside the existing app shell.
- The deal-detail area will be a ranked inline list rather than a selected-only detail panel.

## 3. Work Breakdown

### Phase 1: Data and Fixtures

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Confirm whether existing fixture fields are sufficient | Codex/User | Not Started | Current assumption: no fixture changes required. |
| Add representative edge-case records if needed | Codex | Not Started | Only needed if user wants stronger demo coverage. |

### Phase 2: Business Logic

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add reusable risk-driver logic in `src/crm.js` | Codex | Not Started | Should share rules with `scoreDealRisk` to prevent drift. |
| Include risk-driver metadata in enriched opportunities | Codex | Not Started | Preserve current output fields. |
| Add optional owner-aware risk-view summary helper | Codex | Not Started | Depends on final visualization choice. |
| Ensure owner filters are applied consistently | Codex | Not Started | Match current dashboard behavior. |

### Phase 3: UI Rendering

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Choose route/view structure | Codex | Not Started | Recommendation locked: full-page view inside existing app shell. Exact mechanism remains open. |
| Render risk visualization | Codex | Not Started | Use scatter plot with risk score and raw deal amount. |
| Render deal details and risk drivers | Codex | Not Started | Use ranked inline list. |
| Add navigation between overview and risk view | Codex | Not Started | Keep simple and static-friendly. |
| Add empty and filtered states | Codex | Not Started | Include owner-specific empty states. |
| Update styles in `src/styles.css` | Codex | Not Started | Maintain current restrained dashboard style. |

### Phase 4: Testing and Verification

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Add `test/crm.test.js` coverage for risk drivers | Codex | Not Started | Include point totals and cap behavior. |
| Add tests for new summaries if introduced | Codex | Not Started | Depends on selected visualization. |
| Run `npm test` | Codex | Not Started | Required before handoff. |
| Run `npm run dev` and verify in browser | Codex | Not Started | Required for UI changes. |

## 4. Detailed Steps

1. Resolve remaining product questions about scatter plot interaction details.
2. Resolve technical question about the exact app-shell route mechanism.
3. Refactor risk scoring in `src/crm.js` so scoring and risk-driver explanations use the same underlying rules.
4. Add unit tests for driver explanations and score alignment.
5. Add the new risk view UI.
6. Wire owner filtering into the risk view.
7. Add responsive styling and accessible labels.
8. Run automated tests.
9. Start the app and verify the overview and risk view in the browser.
10. Document any deferred follow-up work.

## 5. Test Plan

### Automated Checks

```bash
npm test
```

Expected result:

- All existing CRM business logic tests pass.
- New tests cover risk-driver output and score alignment.
- Any new summary helpers are covered.

### Local App Verification

```bash
npm run dev
```

Expected result:

- Existing dashboard loads without console-breaking errors.
- Risk view is reachable.
- Scatter plot renders with the expected opportunities.
- Owner filters update the risk visualization and deal details consistently.
- Risk-driver explanations are visible and match the displayed risk score.

## 6. Acceptance Criteria

- A user can open a full-page risk view from the dashboard.
- The view compares opportunity risk against raw deal amount.
- The view shows deal details and risk drivers for each visible opportunity.
- Owner filtering affects the risk view consistently.
- Existing overview dashboard behavior remains intact.
- Unit tests cover the new deterministic risk-driver logic.

## 7. Rollback Plan

- Revert any new navigation or page files.
- Revert risk-driver changes in `src/crm.js`.
- Revert UI rendering and styling changes.
- Keep any tests only if they still describe supported behavior.

## 8. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Scatter plot is visually confusing with small data set | Users may not understand the view | Pair visualization with ranked details and clear axis labels. |
| Risk-driver logic drifts from score logic | Users see explanations that do not match scores | Generate score and drivers from shared rule definitions. |
| Full-page navigation complicates the static app | More code paths to maintain | Choose the simplest page or view structure after user decision. |
| Owner filter state is inconsistent across views | Users may see mismatched summaries | Keep filtering in shared render logic or shared helper functions. |

## 9. Dependencies

- Existing CRM data from `/api/crm` or `data/crm.json`.
- Existing enrichment and filter helpers in `src/crm.js`.
- User decision on remaining scatter plot interaction details.

## 10. Open Questions

- Should scatter plot points be clickable and synchronize with the ranked detail list in V1?
- Should the scatter plot include risk threshold bands and deal-size reference lines?
- Should the owner filter state persist when navigating between the overview and risk view?

## 11. Progress Log

| Date | Update | Owner | Notes |
| --- | --- | --- | --- |
| 2026-06-10 | Created first-pass feature spec documents. | Codex | Awaiting user answers to open questions before implementation. |
| 2026-06-10 | Updated plan with selected scatter plot direction and Codex-recommended defaults. | Codex | No app implementation started. |
