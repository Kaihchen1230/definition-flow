# Request-Definition-Driven Approval Platform POC

This repository is a proof of concept for turning an approval workflow application into a request-definition-driven platform.

The POC uses a startup investment approval scenario to demonstrate:

- modular YAML definitions for data schema, UI, rules, derived facts, calculations, and workflow
- a Java Spring Boot backend as a modular monolith
- Postgres as the target persistence mode, with H2 as a convenience fallback
- a React/Vite frontend using Redux Toolkit and RTK Query
- a React renderer consuming a framework-neutral evaluated UI contract from the backend
- backend-authoritative rules, validation, actions, workflow transitions, calculation stale tracking, and audit

## Repository Shape

```text
backend/                         Spring Boot modular monolith
frontend/                        React/Vite renderer with Redux Toolkit and RTK Query
definitions/startup-investment/  Developer-maintained YAML definitions
docs/                            Proposal and rule DSL spec
scripts/                         Local helper scripts
docker-compose.yml               Optional Postgres runtime
```

## Frontend Shape

```text
frontend/src/app/                         App shell and top-level page wiring
frontend/src/services/                    RTK Query API service
frontend/src/store/                       Redux store setup and typed hooks
frontend/src/features/request-workbench/  Request workbench panels and local UI state slice
frontend/src/features/request-renderer/   Dynamic field, collection, and action renderers
frontend/src/config/                      Static frontend config such as enum options
frontend/src/types/                       Shared API response types
frontend/src/utils/                       Generic helpers
```

## What Is a DSL?

DSL stands for Domain-Specific Language. It is a small language designed for one problem area instead of a general-purpose programming language like Java or TypeScript.

In this POC, the rule DSL is the YAML format used to describe approval-platform decisions in a predictable, non-code way. For example, `rules.yaml` can say that an actor may approve a request only when the workflow is in the right state and the actor has the right entitlement.

That lets the platform evaluate rules consistently for UI behavior, validation, workflow actions, calculations, and audit without hardcoding every approval scenario into application code.

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

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

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
2. Demo actors and a seeded startup investment request case.
3. Predicate rule evaluation with rule references and trace output.
4. Derived fact evaluation.
5. Approval route calculation with dependency-hash stale tracking.
6. Structured validation buckets for render, submit, and approve.
7. Evaluated UI contract endpoint.
8. Save, calculate, submit, approve, decline, and withdraw action endpoints.
9. Redux Toolkit/RTK Query frontend state and backend API integration.
10. React renderer with page navigation, editable fields/tables/lists, validation summary, workflow actions, and rule trace panel.
11. Baseline backend API integration tests and frontend UI behavior tests.

## Demo Flow

1. Start backend with H2 or Postgres.
2. Run `./scripts/load-definitions.sh startup-investment`.
3. Run `./scripts/reset-demo-data.sh`.
4. Start frontend with `npm run dev`.
5. Use `Avery Analyst` to calculate approval route and submit for investment approval.
6. Switch to `Iris Investment Approver` and approve investment review.
7. Switch to `Riley Risk Officer`, confirm analyst-created exceptions, save, and submit risk review.
8. Switch to `Reese Risk Approver` and approve final request.
