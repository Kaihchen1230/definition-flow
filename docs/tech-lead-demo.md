# DefinitionFlow Tech-Lead Demo

This guide is a 10–12 minute demonstration of the POC's strongest architectural ideas. The application works without enabling any prepared demo code. Optional live-edit snippets are already present as comments marked `DEMO` and can be enabled one at a time.

## The Story to Tell

DefinitionFlow separates stable platform mechanics from request-specific configuration:

- The backend owns persistence, audit, calculations, workflow topology, and state mutation.
- The frontend owns the typed page definition, draft-time business rules, derived facts, validation, and action eligibility for this internal-app POC.
- A request page remains the unit of completion, validation targeting, and page-scoped saving even though pages are presented in navigation groups.
- Semantic component IDs keep page configuration independent of a particular UI implementation.

The central message is: **one evaluation context, one small rule DSL, and several consumers**. The same draft data can immediately drive visibility, required state, validation, editability, completion, and workflow actions.

## Preflight

Do this before the meeting:

1. Start Postgres and the backend, or use the H2 fallback.
2. Load the `startup-investment` definition and reset demo data.
3. Start the frontend.
4. Open all three seeded requests once and confirm the ten-user selector is populated.
5. Keep the browser and these files open side by side:
   - `frontend/src/config/pages/companyProfile.ts`
   - `frontend/src/config/pages/investmentTerms.ts`
   - `frontend/src/rules/startup-investment/index.ts`
   - `frontend/src/rules/startup-investment/derivedFacts.ts`
   - `frontend/src/rules/startup-investment/uiRules.ts`
   - `frontend/src/rules/startup-investment/validationRules.ts`
6. Search for `DEMO:` to locate every prepared live-edit block.

Use separate terminals for the long-running backend and frontend commands.

From the repository root, start Postgres:

```bash
docker compose up -d postgres
```

In a backend terminal:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Back at the repository root, prepare deterministic demo data:

```bash
./scripts/load-definitions.sh startup-investment
./scripts/reset-demo-data.sh
```

In a frontend terminal:

```bash
cd frontend
npm run dev
```

If Postgres is inconvenient, run the backend with:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

## Main Demo Flow

### 1. Start with configuration-driven intake — 90 seconds

Create a new request as **Avery Analyst**.

1. Point out that the page is rendered from `companyProfile.ts`, not hard-coded form JSX.
2. Change **Company Stage** and **Industry Sector** to show configured radio and dropdown renderers.
3. Select **Other** for Industry Sector.
4. Show that **Specify Industry Sector** appears, gains a required marker, affects page completion, and produces inline validation if left empty.

Connect the behavior to three focused locations:

- `companyProfile.ts` attaches `showOtherCompanySector` through `visibleRule` and `requiredRule`.
- `uiRules.ts` defines when the field is presented and required.
- `validationRules.ts` blocks workflow submission and targets the same field.

Talking point: presentation and workflow validation are separate concerns, but they share the same named business condition.

### 2. Show grouped pages and page-scoped persistence — 60 seconds

1. Expand and collapse the Company, Investment, Risk Review, and Decision groups.
2. Use **Back** and **Next** across a group boundary.
3. Edit one page and save it.

Explain that groups are presentation metadata. Visible child-page order determines navigation, while the patch contains only paths owned by the saved page. The backend merges that patch without replacing unrelated request data.

### 3. Show derived behavior — 90 seconds

Open **Acme Robotics**. It is a Seed-stage, $6.5M case with a high exception.

1. Explain that `investmentVariant` evaluates to `HIGH_RISK` from the current draft.
2. Switch to **Riley Risk Officer** after the request reaches risk review.
3. Show that **Enhanced Risk Review** appears only for the correct risk context.
4. Compare with **Harbor Health**, the standard Growth-stage case.

Talking point: repeated business classification is calculated once as a derived fact and referenced as `derived.investmentVariant` by downstream rules.

### 4. Show entitlement-aware workflow actions — 3 minutes

Use a request configured for Investment Levels 1 and 3:

1. As **Avery Analyst**, submit the request to Investment Level 1.
2. Keep Avery selected and show that Avery cannot approve; only the globally entitled **Withdraw request** action remains.
3. Switch to **Iris Investment Approver · L1** and approve to the next selected level.
4. Switch back to Avery and show that no approval action appears.
5. Switch to **Ivan Investment Approver · L3** and complete investment approval.
6. At risk review, use **Riley Risk Officer** to complete confirmations and select risk levels.
7. Switch through only the selected risk approvers.

Point out the current user's entitlement list in the header. Backend transitions define what is structurally possible; `workflowActionRules.ts` maps them to frontend capabilities. Unknown mappings fail closed.

### 5. Close on maintainability — 60 seconds

Open `frontend/src/rules/startup-investment/index.ts` and show that callers receive one assembled catalog while each responsibility has a focused file:

- `capabilities.ts`: authority and editability
- `derivedFacts.ts`: reusable classifications
- `uiRules.ts`: visibility and conditional required state
- `validationRules.ts`: targeted issues and blocking scopes
- `workflowActionRules.ts`: transition-to-capability mappings and labels

Finish with the component registry: page definitions use vendor-neutral IDs such as `currencyInput` and `radioGroup`; focused adapters choose the actual renderer.

## Optional Live-Edit Segment

Do only one or two of these during the meeting. The first two are the safest and most visual.

### A. Swap a field renderer

In `companyProfile.ts`, find the `DEMO` comment above `companyStage`:

1. Comment out `component: 'radioGroup'`.
2. Uncomment `component: 'dropdown'`.
3. Save and let Vite refresh.

The same field, data path, options, rules, and persistence behavior remain intact; only the renderer changes.

### B. Make a page conditional

1. In `uiRules.ts`, uncomment `showRiskIndicators`.
2. In `investmentIndicators.ts`, replace `visibleRule: null` with the prepared `visibleRule: "showRiskIndicators"` line.
3. Change Company Stage between **Seed** and **Growth**.

The Risk Indicators page and its empty parent group behavior update from the current draft.

### C. Add a reusable derived fact and conditional requirement

Enable the prepared blocks in this order:

1. Uncomment `isLargeInvestment` in `derivedFacts.ts`.
2. Uncomment `requireUseOfFundsForLargeInvestment` in `uiRules.ts`.
3. In `investmentTerms.ts`, change **Planned Use of Funds** from `required: true` / `requiredRule: null` to `required: false` / `requiredRule: "requireUseOfFundsForLargeInvestment"`.
4. In `validationRules.ts`, comment out `investmentUseOfFundsRequired` and uncomment `useOfFundsRequiredForLargeInvestment`.
5. Enter amounts below and above $5M while leaving Planned Use of Funds blank.

This demonstrates why conditional requirements need both layers: the UI rule supplies immediate affordance and completion state, while the validation rule blocks the relevant workflow scopes. Both reuse one derived business fact.

### D. Narrow a field capability

1. Uncomment `canEditInvestmentAmount` in `capabilities.ts`.
2. In `investmentTerms.ts`, replace the investment amount's `enabledRule: "canEditInvestmentReview"` with `enabledRule: "canEditInvestmentAmount"`.
3. Compare Avery in Investment Review with another user or later workflow state.

This shows that capability names describe business authority and are independent of the renderer.

### E. Add an enum option

Uncomment **Climate Tech** in `enumOptions.ts`. The new option appears without changing the dropdown renderer or page definition.

## Questions the Tech Lead Is Likely to Ask

### Why are business rules evaluated in the frontend?

For this internal-app POC, it gives immediate feedback against unsaved draft data and avoids duplicating a rule evaluator. The backend remains authoritative for persistence, audit, calculation execution, workflow topology, and mutation. A production threat model may require critical authorization and workflow rules to be enforced independently on the backend.

### How are rule changes audited?

Frontend mutations include `frontendRuleCatalogVersion`, which is retained in audit details. Behavior changes require incrementing that version; structural refactors do not.

### What prevents broken configuration?

Startup validation fails fast for unknown components, rules, option catalogs, data paths, and duplicate node IDs. Tests cover the evaluator, catalog decisions, visible UI behavior, navigation, and API boundaries.

### Is this remotely managed configuration?

Not yet. Page and rule definitions are typed TypeScript compiled with the frontend. This maximizes refactor safety for the POC. A later phase could define a versioned transport format, schema validation, authoring controls, and rollout strategy.

### Why separate UI rules from validation?

They produce different outcomes. UI rules describe presentation and required affordances; validation rules create targeted issues with severity and workflow scope. Sharing named predicates or derived facts keeps their business conditions synchronized without collapsing their responsibilities.

## Production Caveats to State Proactively

- Frontend-only authorization is a conscious POC boundary, not a general security recommendation.
- TypeScript configuration currently deploys with the frontend; it is not a no-deploy business authoring system.
- Rule-catalog versioning exists, but production rollout and backward-compatibility policies still need definition.
- The demo catalog and users are fixtures, not an identity-governance model.

## Recovery During the Demo

If a live edit goes wrong, undo the last edit or restore only the file you changed. The application requires none of the prepared snippets, so returning all `DEMO` blocks to comments restores the verified baseline.
