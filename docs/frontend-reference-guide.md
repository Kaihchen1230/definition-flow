# Frontend Reference Implementation Guide

This POC is a reference architecture, not a package that another team installs unchanged. A team building its own request frontend should preserve the seams below and replace the startup-investment definitions with its own domain modules.

For file-by-file examples of component mapping, options, rule configuration, page ordering, and workflow changes, see [Frontend Configuration Walkthrough](frontend-configuration-walkthrough.md).

## The Main Seam

The backend response from `GET /api/request-cases/{id}/evaluation-context` is the seam between persistence/workflow and frontend decisions. It contains only:

- request identity and workflow state
- the current user, role, and entitlements
- raw request data
- stored calculation results and freshness
- active backend definition versions
- transition IDs currently available from the workflow topology

The frontend adds all immediate decision-making to that context. `evaluateFrontendContext.ts` evaluates derived facts, capabilities, validation, and action eligibility against the Redux draft. `evaluateUiDefinition.ts` then applies those results to the page configuration.

This separation is what another team should copy. Their UI should not depend on a backend-generated page tree or wait for a round trip to decide whether a draft field is required, visible, or eligible for submission.

## Reuse Versus Replace

Reuse these modules and their tests with minimal change:

| Module | What it provides |
| --- | --- |
| `rules/evaluateRule.ts` | The typed predicate and collection-rule evaluator |
| `rules/types.ts` | The rule, validation, and derived-fact definition shapes |
| `utils/evaluateUiDefinition.ts` | Applies rule results to static page nodes |
| `utils/objectPath.ts` | Reads and immutably writes nested draft values |
| `utils/pageCompletion.ts` | Computes page completion from evaluated required fields |
| `features/request-workbench/` | Draft lifecycle, page navigation, validation mode, and page-scoped saving |
| `services/approvalApi.ts` | The expected RTK Query integration pattern |

Replace these startup-investment examples with domain-specific modules:

| Example module | Team-owned replacement |
| --- | --- |
| `rules/startupInvestmentRules.ts` | Capabilities, UI rules, validation, derived facts, and level-specific action-to-rule assignments |
| `config/pages/*.ts` | One layout/config module for each request page |
| `config/uiDefinition.ts` | Navigation grouping, page ordering, and request-type UI assembly |
| `config/enumOptions.ts` | Select, radio, and checkbox option catalogs |
| `features/request-renderer/` | Domain-specific collection renderers; generic field rendering can be reused |

The startup investment files are executable examples of the contract. They should not become a shared corporate rule catalog.

The frontend must increment `frontendRuleCatalogVersion` when a deployed rule catalog changes. RTK Query sends that version with mutations so audit events can identify which compiled frontend rules participated in the decision.

Workflow actions fail closed: an action returned by the backend is hidden and disabled unless its ID is mapped to a frontend eligibility rule. Recognized IDs also receive a readable fallback label when a stale or mismatched backend returns the raw action ID as its label. Submitting a review routes it into the first selected approval queue; advancing from that queue requires the matching level approval entitlement.

## Component mapping and config validation

Page files under `frontend/src/config/pages/` choose a renderer with the node's `component` property. Allowed component IDs are declared in `frontend/src/types/uiComponents.ts`; `frontend/src/features/request-renderer/componentRegistry.tsx` is the single mapping from those IDs to React renderers. Add a component in both places, then reference its ID from page config.

`frontend/src/config/uiDefinition.ts` validates the assembled definition at startup. It rejects duplicate or empty navigation groups, duplicate node IDs, and unknown component IDs, rule references, data paths, or option catalogs. Group order followed by child-page order defines the navigation sequence. This turns a configuration typo into an immediate development error instead of a blank or incorrectly rendered field.

Field behavior and user-facing guidance belong beside the field configuration. Use `helperText` for field-specific instructions, option `description` for supplemental radio-choice explanations, and `constraints` for numeric bounds, currency codes, dates such as `maxDate: "today"`, and allowed values; use `itemConstraints` and `collectionConstraints` for editable collections. Currency controls format values for display while retaining numeric request data. Conditional collection requirements use `requiredFieldRules`. The same evaluated metadata drives input behavior, inline invalid styling, page completion, and workflow blocking.

## Draft and workflow safety

Child links and Back/Next navigation save the current page's scoped patch before moving to another visible request page. The selected page's group remains expanded, group completion aggregates visible child pages, and groups without visible pages are hidden. Request/user switching, new-request creation, definition reload, and demo reset are disabled while the page has unsaved changes. Workflow transitions enable validation mode and remain blocked until every visible page is complete; API failures are shown in the workbench rather than silently ignored. See [Grouped Page Navigation](grouped-page-navigation.md) for the complete interaction contract.

The POC starts with a config-driven Company Profile intake instead of creating a backend record immediately. Once the required fields pass the same semantic completion checks used by the workbench, the frontend creates an empty request using the workflow definition's initial state and immediately applies those values as the first page-scoped patch. If creation succeeds but the patch fails, the frontend retains the created request ID and retries the patch instead of creating duplicates. Seeded scenarios remain available through the request selector.

Definition reload and demo reset are intentionally excluded from the product UI. Contributors can run `scripts/load-definitions.sh` and `scripts/reset-demo-data.sh` when operating the local POC.

## Adoption Sequence

1. Agree on the raw evaluation-context response with the backend team.
2. Copy the evaluator, its types, and its operator tests.
3. Model business capabilities first, using names such as `canEditInvestmentReview` rather than names tied to buttons.
4. Add validation and derived facts using the same named-rule catalog.
5. Define one page-config module per page and connect nodes to rules by ID.
6. Map backend transition IDs to frontend eligibility rules.
7. Keep the server authoritative for persistence, audit, calculation storage, and workflow mutation.
8. Test rules as decision tables and test user-visible behavior at the workbench interface.

The startup-investment example maps three investment levels and four risk levels. The backend exposes the possible next transitions from the current tier; frontend rules expose only the transition to the next selected tier—or the completion transition when no selected tier remains—and require the current user's matching entitlement.

The useful depth is behind two small interfaces:

```text
raw backend context + frontend draft
                 |
                 v
       evaluateFrontendContext
                 |
                 v
 permissions + facts + validation + eligible actions

page config + evaluated frontend context
                 |
                 v
         evaluateUiDefinition
                 |
                 v
       render-ready visible page tree
```

Callers do not need to understand individual rule operators or walk page trees themselves. Those details remain local to the evaluator modules.

## Empty Request Lifecycle

`POST /api/request-cases?userId={userId}` with `{ "requestType": "startupInvestment" }` creates a request with:

- the workflow definition's `initialState`
- `requestData` persisted as `{}`
- creator and assignee set to the current user
- a `CREATE_REQUEST` audit event

The renderer treats absent scalar paths as blank values and absent collection paths as empty lists. Nested objects are created only when the user edits or saves their page. Validation is evaluated immediately but is surfaced as blocking field state only when the user attempts the corresponding submit action.

This means a new request can begin with no data on any page without weakening submit validation or adding a large default-data object that must stay synchronized with the page configuration.

## Trust Model

This POC intentionally trusts frontend permission, validation, and action-eligibility decisions. That is suitable only when the frontend and its users are inside the intended trusted boundary. A product exposed to untrusted clients must enforce security and integrity invariants on the backend even if the frontend evaluates the same rules for immediate feedback.
