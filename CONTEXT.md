# DefinitionFlow Context

DefinitionFlow is a POC for reusable, definition-backed request workflows whose frontend evaluates presentation and decision rules while the backend persists request state and workflow transitions.

## Language

**Approval requirement**:
The manually selected set of authority tiers that must approve a request during one review phase.
_Avoid_: Computed route, approval route

**Investment approval level**:
One of three authority tiers the investment analyst may include in the investment approval sequence.
_Avoid_: Investment score, calculated investment route

**Risk approval level**:
One of four authority tiers the risk officer may include in the risk approval sequence.
_Avoid_: Risk score, calculated risk route

**Approval level**:
An authority tier in an approval sequence. When multiple tiers are selected, each selected tier approves once in ascending order; unselected tiers are skipped.
_Avoid_: Approval score, computed route

**Approval sequence**:
The ordered set of selected approval levels required within the investment or risk review phase.
_Avoid_: Automatic route, approval score

**Frontend rule catalog**:
The versioned frontend-owned set of permissions, validation, visibility, derived facts, and workflow action eligibility rules.
_Avoid_: Backend UI rules
