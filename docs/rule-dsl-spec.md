# Rule DSL Spec

## Goals

The rule DSL expresses deterministic, side-effect-free rules for:

- UI behavior: visible, disabled, required
- validation: render guidance, save, submit, approve, calculate, collection actions
- action permissions: add/remove item, calculate route, submit, approve, decline, withdraw
- derived facts
- explainability and debug traces
- audit-friendly action decisions

## Non-goals

- no executable callbacks or arbitrary expressions inside rule config
- no arbitrary formula language in v1
- no mutation of request data
- no direct database queries inside rules
- no external API calls inside rules
- no full JSONPath/filter language in v1
- no admin-authored schema changes in v1

## Evaluation Context

Rules evaluate in the frontend against a runtime context assembled from the backend response and the current unsaved Redux draft:

```json
{
  "user": {},
  "workflow": {},
  "request": {},
  "requestData": {},
  "businessContext": {},
  "derived": {},
  "calculations": {},
  "evaluation": {}
}
```

Rule paths are absolute within this context:

```ts
{ path: "workflow.state", op: "eq", value: "RISK_REVIEW" }
{ path: "user.entitlements", op: "contains", value: "EDIT_RISK_REVIEW" }
{ path: "requestData.investment.amount", op: "gte", value: 5_000_000 }
```

UI data paths are relative to `requestData` unless explicitly marked otherwise.

## Composition

Use intuitive boolean composition:

```ts
{
  and: [
    { path: "workflow.state", op: "in", value: ["DRAFT", "INVESTMENT_REVIEW"] },
    { path: "user.entitlements", op: "contains", value: "EDIT_INVESTMENT_REQUEST" },
  ],
}
```

Supported composition:

- `and`
- `or`
- `not`

## Operators

Comparison:

- `eq`
- `neq`
- `in`
- `notIn`
- `contains`
- `gt`
- `gte`
- `lt`
- `lte`

Presence:

- `exists`
- `missing`
- `empty`
- `notEmpty`

Collection:

- `count`
- `minCount`
- `maxCount`
- `anyItem`
- `allItems`
- `noItems`

## Missing, Null, and Type Mismatch

- Missing path evaluates to `false` and is traced as `missing`.
- `null` is different from missing.
- `exists` is true for `null`.
- `empty` is true for `null`.
- Type mismatch evaluates to `false` and is traced as `typeMismatch`.
- No implicit coercion.
- Action and workflow rules fail closed.

## Collection Rules

Collection rules use `$item` for item scope:

```ts
{
  allItems: {
    path: "requestData.clients",
    where: { path: "$item.roles", op: "contains", value: "BORROWER" },
    rule: { path: "$item.financialStatements", op: "minCount", value: 1 },
  },
}
```

## UI Behavior

- Hidden parent hides all children.
- Disabled parent disables editable children/actions.
- Hidden fields do not show client required validation.
- Disabled fields can still participate in frontend workflow validation.
- Visibility does not manage data lifecycle. Hidden data is not automatically deleted.
- `uiRequired` and `blockingValidation` are separate concerns.

## Versioning

Frontend rule config ships with the frontend build. The frontend sends `X-Frontend-Rule-Catalog-Version` with mutations, and the backend records that value in audit details.

Backend YAML definitions remain versioned independently. Calculation audit records also include the calculation engine and its rule-set version. These versions answer different questions:

- frontend rule-catalog version: which immediate permission, validation, and eligibility rules the UI evaluated
- backend definition version: which workflow, schema, and calculation dependency configuration LOOP loaded
- calculation rule-set version: which business calculation logic the calculation engine executed

See `docs/calculation-engine-integration.md` for the calculation-engine seam and freshness ownership.
