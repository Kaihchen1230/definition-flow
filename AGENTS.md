# DefinitionFlow Contributor Guide

Use this guide when making changes in this repository so the POC stays consistent across contributors and AI agents.

## Project Shape

- `backend/`: Spring Boot modular monolith.
- `frontend/`: React/Vite UI renderer.
- `definitions/startup-investment/`: backend-owned data schema, calculation, and workflow YAML definitions.
- `docs/`: design notes and DSL docs.
- `scripts/`: local helper scripts.

## Frontend Conventions

- Use ES6 arrow functions for React components and helpers.
- Keep `frontend/src/main.tsx` as bootstrap only.
- Put top-level app state and app wiring in `frontend/src/app/`.
- Use Redux Toolkit for frontend state.
- Use RTK Query for backend request/mutation endpoints in `frontend/src/services/`.
- Put Redux store setup and typed hooks in `frontend/src/store/`.
- Put shared API response types in `frontend/src/types/`.
- Put static frontend config in `frontend/src/config/`.
- Put the frontend-owned business-rule catalog, derived facts, evaluator, and tests in `frontend/src/rules/`.
- Keep frontend-owned request page UI config in `frontend/src/config/pages/`, one file per page; assemble navigation groups and page order in `frontend/src/config/uiDefinition.ts`. Group order followed by child-page order is the request navigation sequence.
- Register renderer component IDs in `frontend/src/types/uiComponents.ts` and their implementations in `frontend/src/features/request-renderer/componentRegistry.tsx`; UI definitions must fail fast on unknown components, rules, option catalogs, data paths, or duplicate node IDs.
- Put reusable request workbench panels in `frontend/src/features/request-workbench/`.
- Put the pre-persistence request creation experience in `frontend/src/features/request-intake/`; reuse page config and semantic completion rules, then create the empty request and save the initial page as a scoped patch.
- Put dynamic request rendering components in `frontend/src/features/request-renderer/`.
- Map each scalar component ID directly to its focused renderer under `frontend/src/features/request-renderer/fields/`; keep request-data binding in the shared `configuredField` adapter and shared label/helper behavior in `FieldPresentation`.
- Keep swappable internal UI implementations under `frontend/src/features/request-renderer/fields/`; preserve vendor-neutral semantic component IDs in page config and switch implementations behind a renderer adapter export.
- Put generic helpers in `frontend/src/utils/`.
- Prefer named exports for local modules.
- Keep components focused on rendering and interaction; avoid hiding API calls or business rules inside low-level field components.
- Save request edits with page-scoped data patches from the current page's `dataPath` values; do not send the full request data object from the frontend unless a feature explicitly requires whole-request replacement.
- Evaluate permissions, visibility, required state, validation, derived facts, and workflow action eligibility immediately from the frontend draft. The backend returns raw request/user/calculation context and available transition IDs; it does not configure or evaluate business rules for this POC.
- Do not reintroduce large multi-purpose files like the original all-in-one `main.tsx`.
- Do not add React Query for new data fetching; use the existing RTK Query service.
- Enable frontend validation mode when the user first attempts a submit workflow action.
- Surface frontend-required fields inline with field-level invalid states and page completion indicators; do not reintroduce a broad validation summary panel unless the product direction changes.
- Express semantic field constraints (such as past-only dates, numeric ranges, allowed options, and collection totals) in page config so completion and rendered input constraints stay aligned.
- Pair add/remove controls for editable frontend collections when the user is allowed to add items.

## Frontend Formatting

- Use TypeScript strict mode.
- Keep imports ordered by rough locality:
  1. React/library imports
  2. app/API/config imports
  3. feature/component imports
  4. type-only imports
- Use `type` imports where values are not needed at runtime.
- Keep JSX readable rather than overly clever; extract a component when a block becomes hard to scan.
- Preserve existing Tailwind utility style unless introducing a broader design-system change.

## Backend Conventions

- Treat the backend as authoritative for persistence, audit, calculations, and workflow state mutation, but not for business-rule enforcement in this internal-app POC.
- Mutation endpoints intentionally trust the frontend's permission and validation decisions. Do not add duplicate backend rule enforcement unless the architecture decision changes.
- Merge page-scoped request data patches into the stored request JSON on the backend; preserve fields that were not included in the patch.
- Create new requests with an empty request-data object and take their initial state from the active workflow definition; do not duplicate page defaults on the backend.
- Keep workflow transition topology, stored calculation freshness, persistence, and audit on the backend. Keep permissions, validation, derived facts, UI rules, and action eligibility in the frontend.
- In the active startup-investment POC, approval requirements are manually selected tier sets: up to three investment levels selected by the analyst and up to four risk levels selected by the risk officer. Every selected level approves once in ascending order; unselected levels are skipped. Do not reintroduce computed approval routing without an architecture decision.
- Keep calculation execution behind `CalculationEngine`. The local adapter is a POC stand-in for the lending-rule-engine; do not move calculation formulas back into persistence or action modules.
- Persist and expose the calculation engine ID and rule-set version with every stored calculation result.
- Increment `frontendRuleCatalogVersion` whenever deployed frontend rule behavior changes; mutation audit details must retain that version.
- Keep backend request evaluation context code under request-case packages, not a backend `ui` package.
- Prefer small services with clear module ownership over shared catch-all utility classes.
- Keep YAML definition loading deterministic and versioned.
- Refresh the fixed demo-user catalog on backend startup without resetting request cases, calculations, or audit history; reserve the demo reset endpoint for deliberately recreating all fixture data.

## Definition Conventions

- `frontend/src/rules/startup-investment/`: frontend-owned startup-investment rule domain, split by capability, UI, validation, derived-fact, and workflow-action responsibility; `index.ts` is the public assembly module.
- `frontend/src/rules/evaluateRule.ts`: the single TypeScript DSL evaluator used by the UI.
- `workflow.yaml`: workflow/state-machine DSL.
- `frontend/src/config/uiDefinition.ts`: frontend UI definition assembly and shared UI config types.
- `frontend/src/config/pages/*.ts`: frontend-owned UI layout/config objects, one module per request page.
- `data-schema.yaml`: request data model DSL.
- `calculations.yaml`: calculation definition DSL.
- `docs/calculation-engine-integration.md`: calculation-engine ownership, adapter contract, version metadata, and freshness integration guidance.

When adding a rule, name it by capability or business meaning, not by the UI element that happens to use it.

## Verification Commands

Every code change should include relevant backend and/or frontend test coverage. If a change is docs-only or tests do not apply, say that explicitly in the PR.

Prefer behavior tests at public seams:

- Backend: API-visible workflow topology, persistence, calculations, and audit outcomes.
- Frontend: rule operators, validation, permission/action decisions, user-visible UI behavior, state transitions, and API integration boundaries.

Run these before handing off code changes:

```bash
cd backend
mvn -gs .mvn/settings.xml -s .mvn/settings.xml -Dmaven.repo.local=../.m2/repository test
```

```bash
cd frontend
npm run test
npm run build
```

## Documentation Maintenance

- Keep `README.md` and `AGENTS.md` current whenever architecture, setup, workflow, dependencies, or project structure changes.
- If a documented flow, command, package, folder, or convention is no longer true, update it in the same change.
- If stale documentation is no longer useful, remove it instead of leaving conflicting guidance.
- When adding a new contributor rule, include it in `AGENTS.md`.

## Git Hygiene

- Never commit or push directly to `main`.
- Before changing code, create a feature branch from an up-to-date `main`.
- Once the work is verified, push the feature branch and open a PR.
- Do not merge the PR unless explicitly asked.
- Do not commit generated output or local dependency caches.
- `.m2/`, `backend/target/`, `frontend/dist/`, and `frontend/node_modules/` should remain ignored.
- Keep commits focused and describe the user-facing or architectural intent.
