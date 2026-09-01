# Grouped Page Navigation

The request workbench organizes pages into stable business-subject groups without changing what a page means. A page remains the unit of rule evaluation, completion, validation targeting, rendering, and page-scoped persistence. A navigation group is presentation metadata only.

## Configuration

`frontend/src/config/uiDefinition.ts` declares one ordered hierarchy:

```ts
groups: [
  { id: "company", label: "Company", pages: [companyProfilePage, foundersOwnershipPage] },
  { id: "investment", label: "Investment", pages: [investmentTermsPage, investmentIndicatorsPage] },
  { id: "riskReview", label: "Risk Review", pages: [riskExceptionsPage, enhancedRiskReviewPage] },
  { id: "decision", label: "Decision", pages: [approvalRequirementsPage, finalReviewPage] },
]
```

Group order followed by child-page order defines the complete request navigation sequence. Do not maintain a second page-order list. Startup validation rejects duplicate group IDs, empty configured groups, duplicate node IDs across groups, and the existing unknown component, rule, data-path, and option references.

To add a page, define it in `frontend/src/config/pages/` and insert it into exactly one group. To add a group, give it a stable semantic ID and label and provide at least one configured page. Groups do not have visibility rules; a group appears when at least one of its evaluated child pages is visible.

## Interaction Contract

- The selected page's group is always expanded. Other groups can remain manually expanded for the current request.
- Selecting a collapsed group saves a dirty page, expands the group, and opens its first visible child. If saving fails, neither navigation nor expansion occurs.
- Selecting an expanded inactive group collapses it. Selecting the active group does nothing.
- Expansion state resets when the request, acting user, or UI definition changes.
- Child links provide direct navigation. Back and Next traverse all visible pages in configured order, cross group boundaries, and skip hidden pages.
- Every page change uses the same save-before-navigation guard. Back is disabled on the first visible page and Next on the last.
- Validation may still navigate directly to the first blocking page; its group opens because it becomes active.

## Completion and Visibility

Every visible child page retains its completion icon and missing-field tooltip. A group is complete only when all its visible child pages are complete; its missing count is the sum of visible child-page missing counts. Hidden pages do not affect navigation or the group result. A group with no visible children is omitted.

## Responsive and Accessible Behavior

The existing responsive layout places the navigation panel above the content below 820px, where the same disclosure controls remain available. Group buttons expose `aria-expanded` and an accessible complete/incomplete name. Child pages remain real buttons, and Back/Next use native disabled states at sequence boundaries.

## Ownership Boundaries

Grouping does not change workflow topology, permission rules, backend payloads, page-scoped patch construction, or `EvaluatedUi.pages`. `frontend/src/utils/pageNavigation.ts` owns flattening, visible-group derivation, aggregate completion, adjacent-page lookup, and page-to-group lookup so callers do not duplicate hierarchy logic.
