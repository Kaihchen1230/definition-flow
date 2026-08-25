# DefinitionFlow Contributor Guide

Use this guide when making changes in this repository so the POC stays consistent across contributors and AI agents.

## Project Shape

- `backend/`: Spring Boot modular monolith.
- `frontend/`: React/Vite UI renderer.
- `definitions/startup-investment/`: YAML request definitions.
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
- Put reusable request workbench panels in `frontend/src/features/request-workbench/`.
- Put dynamic request rendering components in `frontend/src/features/request-renderer/`.
- Put generic helpers in `frontend/src/utils/`.
- Prefer named exports for local modules.
- Keep components focused on rendering and interaction; avoid hiding API calls or business rules inside low-level field components.
- Save request edits with page-scoped data patches from the current page's `dataPath` values; do not send the full request data object from the frontend unless a feature explicitly requires whole-request replacement.
- Do not reintroduce large multi-purpose files like the original all-in-one `main.tsx`.
- Do not add React Query for new data fetching; use the existing RTK Query service.
- Show frontend validation summaries only after validation mode is enabled in the current session.
- Enable validation mode when the user first attempts a submit workflow action.

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

- Treat the backend as authoritative for mutations.
- Re-check permissions in mutation endpoints even when the frontend hides or disables an action.
- Merge page-scoped request data patches into the stored request JSON on the backend; preserve fields that were not included in the patch.
- Keep workflow transitions, validation, calculation freshness, persistence, and audit on the backend.
- Keep frontend enablement/visibility as UX only; never rely on it as enforcement.
- Prefer small services with clear module ownership over shared catch-all utility classes.
- Keep YAML definition loading deterministic and versioned.

## Definition Conventions

- `rules.yaml`: decision and capability DSL.
- `workflow.yaml`: workflow/state-machine DSL.
- `ui.yaml`: UI layout/config DSL.
- `data-schema.yaml`: request data model DSL.
- `derived-facts.yaml`: derived data DSL.
- `calculations.yaml`: calculation definition DSL.

When adding a rule, name it by capability or business meaning, not by the UI element that happens to use it.

## Verification Commands

Every code change should include relevant backend and/or frontend test coverage. If a change is docs-only or tests do not apply, say that explicitly in the PR.

Prefer behavior tests at public seams:

- Backend: API-visible behavior, workflow/action enforcement, validation, persistence, and audit outcomes.
- Frontend: user-visible UI behavior, state transitions, and API integration boundaries.

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

- Keep `README.md` and `CLAUDE.md` current whenever architecture, setup, workflow, dependencies, or project structure changes.
- If a documented flow, command, package, folder, or convention is no longer true, update it in the same change.
- If stale documentation is no longer useful, remove it instead of leaving conflicting guidance.
- When adding a new contributor rule, include it in `CLAUDE.md`.

## Git Hygiene

- Never commit or push directly to `main`.
- Before changing code, create a feature branch from an up-to-date `main`.
- Once the work is verified, push the feature branch and open a PR.
- Do not merge the PR unless explicitly asked.
- Do not commit generated output or local dependency caches.
- `.m2/`, `backend/target/`, `frontend/dist/`, and `frontend/node_modules/` should remain ignored.
- Keep commits focused and describe the user-facing or architectural intent.
