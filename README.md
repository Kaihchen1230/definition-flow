# Request-Definition-Driven Approval Platform POC

This repository is a proof of concept for turning an approval workflow application into a request-definition-driven platform.

The POC uses a startup investment approval scenario to demonstrate:

- modular backend YAML definitions for data schema, calculations, and workflow topology
- frontend-owned typed rules, validation, derived facts, UI layout config, and page completion indicators
- a Java Spring Boot backend as a modular monolith
- Postgres as the target persistence mode, with H2 as a convenience fallback
- a React/Vite frontend using Redux Toolkit and RTK Query
- a React renderer evaluating the rule catalog immediately against the unsaved draft
- backend-owned persistence, workflow state mutation, and audit
- analyst-selected investment approval levels (three tiers) and risk-officer-selected risk approval levels (four tiers)
- page-scoped request data saves that patch only the current page's data paths
- grouped request navigation with aggregate completion and guarded Back/Next page traversal
- a config-driven Company Profile intake that creates an empty request only after validation, then applies the first page-scoped patch

Teams adapting this POC should start with the [Frontend Reference Implementation Guide](docs/frontend-reference-guide.md), which identifies the reusable evaluator/workbench modules, the domain-specific replacement points, and the trusted-frontend constraint.

The [Internal UI Component Migration Guide](docs/internal-ui-component-migration.md) provides a step-by-step adapter strategy for mapping the semantic renderer IDs to a company's internal React component library without coupling page config or business rules to that library.

The [Grouped Page Navigation Guide](docs/grouped-page-navigation.md) documents the group configuration, disclosure behavior, completion aggregation, and sequential navigation contract.

The [Calculation Engine Integration](docs/calculation-engine-integration.md) documents the retained adapter seam for future lending-rule-engine calculations. Approval routing in the active scenario is intentionally manual.

## Repository Shape

```text
backend/                         Spring Boot modular monolith
frontend/                        React/Vite renderer with Redux Toolkit and RTK Query
definitions/startup-investment/  Backend-owned schema, calculation, and workflow YAML
docs/                            Proposal and rule DSL spec
scripts/                         Local helper scripts
docker-compose.yml               Optional Postgres runtime
```

The backend returns raw request, user, calculation, and available-transition IDs. The frontend owns the business-rule catalog and action-to-rule assignments in `frontend/src/rules`, evaluates them against the current Redux draft, and applies the results to the UI config in `frontend/src/config`.

## Frontend Shape

```text
frontend/src/app/                         App shell and top-level page wiring
frontend/src/services/                    RTK Query API service
frontend/src/store/                       Redux store setup and typed hooks
frontend/src/features/request-workbench/  Request workbench panels and local UI state slice
frontend/src/features/request-renderer/   Dynamic field, collection, and action renderers
frontend/src/config/                      Static frontend config, enum options, and UI layout assembly
frontend/src/config/pages/                One frontend-owned UI config module per request page
frontend/src/rules/                       Business-rule config, DSL evaluator, and context evaluation
frontend/src/types/                       Shared API response types
frontend/src/utils/                       Generic helpers
```

## What Is a DSL?

DSL stands for Domain-Specific Language. It is a small language designed for one problem area instead of a general-purpose programming language like Java or TypeScript.

In this POC, the rule DSL is a typed TypeScript object format used to describe approval-platform decisions predictably. For example, `rules/startup-investment/capabilities.ts` says that a user may approve only when the workflow is in the right state and the user has the right entitlement. The domain's `index.ts` assembles the focused rule modules into one catalog for callers.

One frontend evaluator handles boolean composition, predicates, named references, and per-item collection rules for UI behavior, validation, workflow actions, and derived facts. The backend intentionally does not duplicate this evaluator for the internal-app POC.

## Local Runtime Options

Primary mode uses Postgres:

```bash
docker compose up -d postgres
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Fallback demo mode uses H2:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

Load or reload definitions through the backend dev endpoint:

```bash
./scripts/load-definitions.sh startup-investment
./scripts/reset-demo-data.sh
```

Backend startup automatically refreshes the fixed catalog of ten demo users without changing request cases, calculations, or audit history. Run `reset-demo-data.sh` only when the three seeded request cases and their related data must also be recreated.

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

The evaluation trace rail is controlled in `frontend/src/config/appConstants.ts`.

## Verification

Run backend tests:

```bash
cd backend
mvn -gs .mvn/settings.xml -s .mvn/settings.xml -Dmaven.repo.local=../.m2/repository test
```

Run frontend tests and build:

```bash
cd frontend
npm run test
npm run build
```

## Current Status

The POC currently includes:

1. Versioned YAML definition loading through the backend.
2. Demo users and three seeded startup investment request cases with different analyst-selected investment tiers; risk tiers begin blank for the risk officer to choose.
3. Frontend predicate rule evaluation with rule references, collection scoping, and trace output.
4. Immediate frontend derived-fact and draft validation evaluation.
5. Manual multi-level approval sequences across three investment levels and four risk levels; a replaceable calculation-engine seam remains available for future non-routing calculations.
6. Frontend-owned structured validation buckets for render, investment submit, risk submit, and final approve.
7. Backend evaluation context endpoint with raw request/user/calculation data and available workflow transition IDs.
8. Page-scoped save patching plus level-specific submit/approve, decline, and withdraw action endpoints.
9. Empty draft request creation with no pre-populated page data.
10. Redux Toolkit/RTK Query frontend state and backend API integration.
11. Frontend-owned UI layout with page navigation, page-scoped saves, editable fields/tables/lists, inline required-field validation, add/remove collection controls, workflow actions, and optional rule trace panel.
12. Backend audit metadata linking mutations to the compiled frontend rule-catalog version.
13. Backend API integration tests plus frontend operator, rule-catalog, and UI behavior tests.

## Demo Flow

For a timed tech-lead walkthrough, optional live-edit examples, expected questions, and recovery steps, see [docs/tech-lead-demo.md](docs/tech-lead-demo.md).

1. Start backend with H2 or Postgres.
2. Run `./scripts/load-definitions.sh startup-investment`.
3. Run `./scripts/reset-demo-data.sh`.
4. Start frontend with `npm run dev`.
5. Complete the Company Profile intake and choose **Create request**; the frontend creates the empty backend request, saves the first page, and opens the workbench. Use the request selector to open one of the three demo scenarios instead.
6. Use `Avery Analyst` to complete the request and select one or more of the three investment approval levels.
7. Submit and switch through the selected investment approvers in ascending order.
8. Switch to `Riley Risk Officer`, complete risk-only inputs and page confirmations, and select one or more of the four risk approval levels.
9. Submit and switch through the selected risk approvers in ascending order to complete the request.

## Approval Requirement Logic

Every request follows the same review phases:

`INVESTMENT_ANALYST → SELECTED INVESTMENT LEVEL → RISK_OFFICER → SELECTED RISK LEVEL → APPROVED`

The investment analyst selects any combination of three investment authority tiers. The risk officer later selects any combination of four risk authority tiers. Every selected tier approves once in ascending order, while gaps are allowed—for example, L1 + L3 skips L2. The POC does not compute either sequence.

The derived Standard/High Risk variant remains a frontend UI and validation input for enhanced risk review; it no longer chooses an approver.

Investment Analysts never receive risk-only fields. Risk inputs, risk-authored exceptions, page confirmations, and refer-back notes appear only to Risk Officers after the request enters `RISK_REVIEW`.
