# Frontend Configuration Walkthrough

This guide shows where to make common DefinitionFlow frontend configuration changes. The examples are illustrative: they explain the supported extension points but do not describe changes that must be applied to the current startup-investment flow.

## Configuration Model

```text
Page config        -> what and where to render
Component registry -> which React component implements it
Enum config        -> available choices
Rule catalog       -> visibility, editability, required state, validation, and action eligibility
Workflow YAML      -> possible workflow states and transitions
```

The frontend owns presentation and immediate business-rule evaluation. The backend owns persistence, audit, calculation storage, and workflow mutation.

## 1. Change Which Component Renders a Field

Example: render **Company Stage** as radio buttons instead of a dropdown.

Open `frontend/src/config/pages/companyProfile.ts` and find the field:

```ts
{
  id: "companyStage",
  type: "field",
  component: "dropdown",
  dataPath: "company.stage",
  label: "Company Stage",
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: true,
  requiredRule: null,
}
```

Change only the component ID:

```ts
{
  id: "companyStage",
  type: "field",
  component: "radioGroup",
  dataPath: "company.stage",
  label: "Company Stage",
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: true,
  requiredRule: null,
}
```

No React component needs to change because `radioGroup` is already registered.

The component mapping follows this path:

```text
frontend/src/config/pages/companyProfile.ts
component: "radioGroup"
             |
             v
frontend/src/types/uiComponents.ts
allowed component IDs
             |
             v
frontend/src/features/request-renderer/componentRegistry.tsx
component ID -> React renderer
```

## 2. Change the Options for a Field

Example: add **Climate Tech** as a company sector.

Open `frontend/src/config/enumOptions.ts`:

```ts
"company.sector": [
  { value: "AI", label: "AI" },
  { value: "FINTECH", label: "FinTech" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "CLIMATE_TECH", label: "Climate Tech" },
  { value: "OTHER", label: "Other" },
],
```

The `label` is the text shown in the UI. The `value` is stored in request data:

```json
{
  "company": {
    "sector": "CLIMATE_TECH"
  }
}
```

If the backend data schema restricts the allowed values, add `CLIMATE_TECH` to `definitions/startup-investment/data-schema.yaml` as well.

## 3. Change a Label or Helper Text

Example: explain what the investment amount represents.

Open `frontend/src/config/pages/investmentTerms.ts`:

```ts
{
  id: "investmentAmount",
  type: "field",
  component: "currencyInput",
  dataPath: "investment.amount",
  label: "Proposed Investment Amount",
  helperText: "Enter the total amount requested for approval.",
  constraints: {
    min: 1,
    step: 1,
  },
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: true,
  requiredRule: null,
}
```

`Field.tsx` renders `helperText` below the configured field. Instructions should be specific to the field; avoid generic implementation language such as “editable request data.”

## 4. Add or Change a Visibility Rule

Example: only show **Risk Indicators** for Seed and Pre-revenue companies.

First, add a named rule under `uiRules` in `frontend/src/rules/startupInvestmentRules.ts`:

```ts
showRiskIndicators: {
  description: "Risk indicators apply to early-stage companies.",
  rule: {
    path: "requestData.company.stage",
    op: "in",
    value: ["SEED", "PRE_REVENUE"],
  },
},
```

Then connect the rule to the page in `frontend/src/config/pages/investmentIndicators.ts`:

```ts
export const investmentIndicatorsPage = {
  id: "investmentIndicators",
  label: "Risk Indicators",
  type: "page",
  visibleRule: "showRiskIndicators",
  enabledRule: "canEditInvestmentReview",
  required: false,
  requiredRule: null,
  // children omitted
};
```

The relationship is:

```text
startupInvestmentRules.ts
showRiskIndicators
        |
        v
investmentIndicators.ts
visibleRule: "showRiskIndicators"
```

Startup validation reports an error if a page references a rule ID that does not exist.

## 5. Add or Change an Edit-Permission Rule

Example: only investment analysts can edit the investment amount during Investment Review.

Define a capability in `frontend/src/rules/startupInvestmentRules.ts`:

```ts
canEditInvestmentAmount: {
  description: "Investment analysts can edit the amount during investment review.",
  rule: {
    and: [
      {
        path: "workflow.state",
        op: "eq",
        value: "INVESTMENT_REVIEW",
      },
      {
        path: "user.role",
        op: "eq",
        value: "InvestmentAnalyst",
      },
      {
        path: "user.entitlements",
        op: "contains",
        value: "EDIT_INVESTMENT_REQUEST",
      },
    ],
  },
},
```

Then update the field in `frontend/src/config/pages/investmentTerms.ts`:

```ts
enabledRule: "canEditInvestmentAmount",
```

When the rule evaluates to `false`, the component becomes read-only immediately from the frontend draft context.

## 6. Add a Conditional Required Rule

Example: require **Planned Use of Funds** when the investment exceeds $1 million.

Add a validation rule under `validationRules` in `frontend/src/rules/startupInvestmentRules.ts`:

```ts
useOfFundsRequiredForLargeInvestment: {
  description: "Large investments require a planned use of funds.",
  scope: ["submit", "riskSubmit", "approve"],
  severity: "blocking",
  pageId: "investmentTerms",
  nodeId: "useOfFunds",
  rule: {
    or: [
      {
        path: "requestData.investment.amount",
        op: "lte",
        value: 1_000_000,
      },
      {
        path: "requestData.investment.useOfFunds",
        op: "notEmpty",
      },
    ],
  },
  message: "Describe the planned use of funds for investments over $1 million.",
},
```

The rule passes when either:

- the amount is no more than $1 million; or
- Planned Use of Funds has a value.

For a conditional requirement, keep two concerns synchronized:

1. A UI rule controls whether the required marker appears through `requiredRule`.
2. A validation rule blocks the appropriate workflow actions.

Do not rely on a validation rule alone if the UI must display the field as required before submission.

## 7. Add a Derived Fact

Example: classify an investment as large when its amount is at least $5 million.

Add a derived-fact definition in `frontend/src/rules/startupInvestmentRules.ts`:

```ts
isLargeInvestment: {
  description: "Identifies investments of at least $5 million.",
  rule: {
    path: "requestData.investment.amount",
    op: "gte",
    value: 5_000_000,
  },
},
```

Other rules can then reference the fact:

```ts
{
  path: "derived.isLargeInvestment",
  op: "eq",
  value: true,
}
```

This prevents the same `$5M` comparison from being repeated across visibility, validation, and action rules.

## 8. Add a New Component Type

Example: introduce a `percentageInput` component.

### Step 1: Declare the component ID

Open `frontend/src/types/uiComponents.ts`:

```ts
export const uiComponentIds = [
  "textInput",
  "dateInput",
  "currencyInput",
  "percentageInput",
  // other IDs
] as const;
```

### Step 2: Create the React component

Create:

```text
frontend/src/features/request-renderer/PercentageInput.tsx
```

The component should accept the existing configured-component props and update the draft through `setData`.

### Step 3: Register the component

Open `frontend/src/features/request-renderer/componentRegistry.tsx`:

```ts
import { PercentageInput } from "./PercentageInput";

export const componentRegistry = {
  // existing mappings
  percentageInput: PercentageInput,
};
```

### Step 4: Use it in page configuration

For example:

```ts
{
  id: "totalOwnership",
  type: "field",
  component: "percentageInput",
  dataPath: "ownership.total",
  label: "Total Ownership",
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: true,
  requiredRule: null,
}
```

Adding a new component requires React code. Switching among existing component IDs does not.

## 9. Change Page Placement or Ordering

Open `frontend/src/config/uiDefinition.ts`.

The order of the `pages` array determines the request navigation order:

```ts
pages: [
  companyProfilePage,
  foundersOwnershipPage,
  investmentTermsPage,
  riskExceptionsPage,
  investmentIndicatorsPage,
  approvalRequirementsPage,
  enhancedRiskReviewPage,
  finalReviewPage,
],
```

Moving `foundersOwnershipPage` before `investmentTermsPage` moves the page in the sidebar. The order of `children` inside each page file controls the order of fields and sections on that page.

This POC supports config-driven ordering, but not an end-user drag-and-drop layout designer. Developers change and deploy the TypeScript configuration.

## 10. Change Workflow Topology

Example: insert a Compliance Review stage before Risk Review.

Workflow topology is backend-owned. Open `definitions/startup-investment/workflow.yaml`:

```yaml
states:
  - INVESTMENT_REVIEW
  - COMPLIANCE_REVIEW
  - RISK_REVIEW
```

Add transitions:

```yaml
transitions:
  - action: workflow.submitComplianceReview
    from: INVESTMENT_REVIEW
    to: COMPLIANCE_REVIEW

  - action: workflow.completeComplianceReview
    from: COMPLIANCE_REVIEW
    to: RISK_REVIEW
```

After changing the topology:

1. Add user-facing labels for the new transition IDs in the backend evaluation service.
2. Add frontend action-eligibility rules in `frontend/src/rules/startupInvestmentRules.ts`.
3. Add any Compliance Review page configuration and component mappings.
4. Add or update tests for the transition topology and frontend action eligibility.
5. Reload the backend definitions.

The backend determines which transitions are structurally possible. The frontend determines whether the current user should see and use each available transition.

## Rule and Configuration Ownership Summary

| Desired change | File or folder |
| --- | --- |
| Field label, component, placement, helper text, or constraints | `frontend/src/config/pages/` |
| Dropdown, radio, or checkbox choices | `frontend/src/config/enumOptions.ts` |
| Allowed component IDs | `frontend/src/types/uiComponents.ts` |
| Component ID to React component mapping | `frontend/src/features/request-renderer/componentRegistry.tsx` |
| Visibility, editability, required logic, validation, derived facts, or action eligibility | `frontend/src/rules/startupInvestmentRules.ts` |
| Rule-expression evaluation behavior | `frontend/src/rules/evaluateRule.ts` |
| Page ordering and UI-definition assembly | `frontend/src/config/uiDefinition.ts` |
| Data paths recognized by frontend configuration | `frontend/src/config/startupInvestmentDataPaths.ts` |
| Backend request-data schema | `definitions/startup-investment/data-schema.yaml` |
| Workflow states and possible transitions | `definitions/startup-investment/workflow.yaml` |

## Versioning Frontend Rule Changes

When deployed frontend rule behavior changes, increment `frontendRuleCatalogVersion` in `frontend/src/config/appConstants.ts`.

The frontend sends this version with mutations so audit events can record which compiled frontend rule catalog participated in a decision. Label-only or documentation-only changes do not normally require a rule-catalog version increment.

## Verification

For frontend configuration and rule changes:

```bash
cd frontend
npm run test
npm run build
```

For backend schema or workflow changes:

```bash
cd backend
mvn -gs .mvn/settings.xml -s .mvn/settings.xml \
  -Dmaven.repo.local=../.m2/repository test
```

After changing backend definitions while the local backend is running:

```bash
./scripts/load-definitions.sh
```

Use `./scripts/reset-demo-data.sh` only when the demo request data itself must be recreated. Definition changes do not automatically require a demo reset.

## Recommended Change Sequence

1. Identify the request data path involved.
2. Decide whether the change affects presentation, business rules, or workflow topology.
3. Change the smallest owning configuration module.
4. Connect page nodes to named rules by ID rather than embedding predicates in components.
5. Add or update behavior tests at the public UI or API seam.
6. Increment the frontend rule-catalog version when rule behavior changes.
7. Run the frontend and backend verification appropriate to the change.
8. Reload backend definitions when YAML definitions changed.
