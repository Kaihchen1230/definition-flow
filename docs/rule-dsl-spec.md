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

- no executable JavaScript, Java, or TypeScript expressions
- no arbitrary formula language in v1
- no mutation of request data
- no direct database queries inside rules
- no external API calls inside rules
- no full JSONPath/filter language in v1
- no admin-authored schema changes in v1

## Evaluation Context

Rules evaluate against a runtime context assembled by the backend:

```json
{
  "actor": {},
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

```yaml
path: workflow.state
path: actor.entitlements
path: requestData.investment.amount
path: derived.investmentVariant
path: calculations.approvalRoute.stale
```

UI data paths are relative to `requestData` unless explicitly marked otherwise.

## Composition

Use intuitive boolean composition:

```yaml
and:
  - path: workflow.state
    op: in
    value: [DRAFT, INVESTMENT_REVIEW]
  - path: actor.entitlements
    op: contains
    value: EDIT_INVESTMENT_REQUEST
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

```yaml
id: borrowersHaveFinancialStatements
scope: [submit, approve]
severity: blocking
rule:
  allItems:
    path: requestData.clients
    where:
      path: $item.roles
      op: contains
      value: BORROWER
    rule:
      path: $item.financialStatements
      op: minCount
      value: 1
message: Each borrower must have at least one financial statement.
```

## UI Behavior

- Hidden parent hides all children.
- Disabled parent disables editable children/actions.
- Hidden fields do not show client required validation.
- Disabled fields can still participate in backend validation.
- Visibility does not manage data lifecycle. Hidden data is not automatically deleted.
- `uiRequired` and `blockingValidation` are separate concerns.

## Versioning

Evaluation uses the latest active definition. Critical actions record the definition versions used in audit events.

