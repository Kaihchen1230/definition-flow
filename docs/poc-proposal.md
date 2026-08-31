# Request-Definition-Driven Approval Platform POC

## Background

LOOP currently supports lending approval workflows where UI behavior, request data, validation, workflow state, memo generation, and approval actions are tightly coupled to existing credit request structures.

Another lending or investment team wants to reuse the approval process, but their data model is different. Reusing the existing application directly is difficult because the current UI and backend behavior are coupled to the existing `CreditRequestData` shape.

## Core Hypothesis

The reusable value is not the existing credit request UI itself. The reusable value is the approval request capability underneath it:

- request lifecycle
- role and entitlement-aware UI behavior
- immediate frontend-owned validation and action eligibility for the internal-app POC
- workflow transitions
- action permissions
- audit
- extension points for memo/report generation

## POC Goal

Prove that a new lending or investment use case can be implemented through modular request definitions and shared platform modules, instead of rebuilding the API, UI, workflow, and reporting stack from scratch.

## Sample Use Case

The POC uses a synthetic Startup Investment Approval Request.

Demo users:

- InvestmentAnalyst
- InvestmentApprover (Levels 1–3)
- RiskOfficer
- RiskApprover (Levels 1–4)
- SupportViewer

Routing paths:

- The Investment Analyst manually selects one or more of three investment approval levels.
- The Risk Officer manually selects one or more of four risk approval levels.
- Each selected level approves once in ascending order; unselected levels are skipped.
- High risk activates enhanced risk inputs and validation; it does not skip an approval stage.
- High risk means amount at least $5M, Seed or Pre-revenue stage, or a material exception.

Workflow states:

- DRAFT
- INVESTMENT_REVIEW
- PENDING_INVESTMENT_APPROVAL_LEVEL_1/2/3
- RISK_REVIEW
- PENDING_RISK_APPROVAL_LEVEL_1/2/3/4
- APPROVED
- DECLINED
- WITHDRAWN

## Working Scope

The POC demonstrates:

- startup investment request rendered from definitions
- text, dropdown, date, radio, checkbox, textarea, table, and collection UI patterns
- page/section/field/action behavior based on user role, entitlement, workflow state, request data, derived facts, and calculation state
- collection add/remove permissions
- role-authored data partitioning
- user confirmation pattern
- derived investment variant
- manual approval-requirement selection
- level-specific workflow actions and approver entitlements
- a calculation-engine adapter seam representing future lending-rule-engine integration
- backend-definition and frontend-rule version traceability
- inline required-field validation with page completion indicators
- rule evaluation trace/debug panel
- Postgres persistence and audit
- H2 fallback for restricted environments

## Out of Scope

- multi-account grouped requests
- full admin page builder
- production memo generation
- file upload
- real Kogito integration
- real lending-rule-engine transport and authentication integration
- real enterprise authentication/authorization integration
- generic Power Apps-style low-code platform

## Architecture

One repo contains:

- `backend/`: Java Spring Boot modular monolith
- `frontend/`: React renderer
- `definitions/startup-investment/`: modular YAML definitions
- `docs/`: proposal and technical specs
- `docker-compose.yml`: optional local Postgres

Backend modules:

- Request Case Repository
- Definition Repository
- Action Registry
- Calculation Engine
- Workflow Adapter
- Audit Logger
- Memo Adapter stub

## Memo Strategy

Memo generation is part of the target architecture but not the initial working scope. The POC includes a memo extension point only.

## Success Criteria

The POC is successful if it can show a new startup investment approval flow driven by frontend-owned rules and backend workflow/persistence modules, with enough workflow/action complexity to prove this is an approval platform, not just a form renderer.
