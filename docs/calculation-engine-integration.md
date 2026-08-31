# Calculation Engine Integration

The calculation implementation in this repository is a local POC adapter. It demonstrates the interface LOOP needs from a calculation engine; it is not a proposed replacement for the existing lending-rule-engine.

The active startup-investment workflow does not calculate its approval route. Its analyst and risk officer manually select the required authority levels, and `calculations.yaml` is intentionally empty. The local approval-route adapter remains only as an executable example of the integration seam for a future use case.

## Ownership

LOOP remains authoritative for:

- associating a calculation result with a request
- persisting the result and execution metadata
- exposing the result in the request evaluation context
- comparing current calculation inputs with the stored input fingerprint
- surfacing calculation freshness to the frontend
- recording calculation execution in the audit history

The calculation engine is authoritative for:

- executing the calculation or lending rule set
- returning the business result
- identifying the engine and rule-set version that produced the result

## Calculation Engine Interface

The backend seam is `CalculationEngine`:

```java
String currentRuleSetVersion(
    String requestType,
    String calculationId,
    JsonNode calculationDefinition
);

CalculationEngineResult calculate(
    String requestType,
    String calculationId,
    JsonNode calculationDefinition,
    JsonNode context
);
```

The current-version operation lets LOOP invalidate a stored result after the engine's active rule set changes. The calculation result contains the result JSON, `engineId`, and the exact `ruleSetVersion` that was executed.

`LocalPocCalculationEngine` is the current adapter. A production lending-rule-engine adapter should satisfy the same interface and translate the generic request context into the lending-rule-engine request and response formats.

## Stored Result

LOOP stores the following for each request calculation:

```json
{
  "calculationId": "approvalRoute",
  "result": {},
  "inputHash": "sha256:...",
  "engineId": "local-poc",
  "ruleSetVersion": "startup-investment-approval-route-v1",
  "calculatedBy": "analyst",
  "calculatedAt": "2026-08-30T14:00:00Z"
}
```

The active backend `CALCULATIONS` definition version identifies the dependency configuration loaded by LOOP. `ruleSetVersion` identifies the business logic executed by the calculation engine. They are separate because deployment of a lending rule set does not necessarily coincide with deployment of a LOOP definition.

## Freshness

The POC computes an input hash from the `dependsOn` paths in `calculations.yaml`. A stored result is stale when a dependency changes or when the calculation engine reports a different current rule-set version.

Before production integration, the LOOP and lending-rule-engine teams must confirm who owns dependency and freshness semantics:

- If the lending-rule-engine returns a reliable input fingerprint or freshness decision, LOOP should store and consume it.
- Otherwise, LOOP can retain the dependency-hash adapter demonstrated by this POC.

Only one module should own the authoritative freshness decision. The frontend may mark an unsaved draft stale immediately for user feedback, but that is not the persisted decision.

## Audit Versions

Mutation requests include `X-Frontend-Rule-Catalog-Version`. Calculation audit details therefore identify:

- backend definition versions
- calculation `engineId`
- calculation `ruleSetVersion`
- frontend rule-catalog version

This metadata makes the POC's decisions traceable across the backend definition, calculation engine, and frontend rule layers.
