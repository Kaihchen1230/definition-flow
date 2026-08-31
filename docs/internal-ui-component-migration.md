# Internal UI Component Migration Guide

This guide explains how to replace the POC's native HTML form controls with an internal React UI component library without changing the request-page configuration or frontend rule model.

The examples use placeholder imports such as `@company/ui`. Replace those names and props with the actual internal library API.

## Recommended Result

Keep the existing semantic component IDs:

```ts
component: "textInput"
component: "dateInput"
component: "currencyInput"
component: "textarea"
component: "dropdown"
component: "radioGroup"
component: "checkboxGroup"
```

Map those IDs to adapters around the internal UI library. Page configuration should describe the kind of interaction required, not the vendor or implementation component used to render it.

For example, this page configuration should remain unchanged:

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

Only the renderer implementation changes:

```text
companyProfile.ts
component: "radioGroup"
        |
        v
componentRegistry.tsx
radioGroup -> ScalarField
        |
        v
Field.tsx or an internal field adapter
radioGroup -> InternalRadioGroup
```

This boundary keeps the POC portable. A team can replace the design system without rewriting page definitions or business rules.

## What Each Layer Owns

| Layer | File | Responsibility |
|---|---|---|
| Page definition | `frontend/src/config/pages/*.ts` | Field identity, semantic component ID, data path, label, rule references, and constraints |
| Allowed component IDs | `frontend/src/types/uiComponents.ts` | Compile-time list of supported semantic renderer IDs |
| Registry | `frontend/src/features/request-renderer/componentRegistry.tsx` | Maps a semantic component ID to a React renderer |
| Data binding | `ScalarField` in `componentRegistry.tsx` | Reads and writes the configured request-data path |
| Scalar control selection | `frontend/src/features/request-renderer/Field.tsx` | Selects text, date, currency, textarea, dropdown, radio, or checkbox rendering |
| Options | `frontend/src/config/enumOptions.ts` | Supplies choices for option-based controls by data path |
| Rule evaluation | `frontend/src/rules/` and `frontend/src/utils/evaluateUiDefinition.ts` | Resolves visibility, disabled state, required state, and validation before rendering |
| Layout | React renderer components and CSS | Controls grid, width, spacing, grouping, and responsive behavior |

The internal UI components must not evaluate `visibleRule`, `enabledRule`, or `requiredRule`. They receive the already evaluated values through `node.visible`, `node.disabled`, and `node.required`.

## Migration Strategy

Use an adapter layer rather than importing internal UI components throughout page configuration or business-rule code.

The lowest-risk sequence is:

1. Install and initialize the internal UI library.
2. Add any required global theme provider at the application boundary.
3. Create internal adapters for scalar controls.
4. Preserve the existing `Field` public props.
5. Replace one semantic component at a time.
6. Add behavior tests for each adapter.
7. Migrate collection renderers separately.
8. Remove old HTML-control code only after parity is verified.

## Step 1: Inventory the Internal Component APIs

Before editing the renderer, document the internal equivalent for every current component ID.

| Semantic ID | Current HTML behavior | Internal component to identify | Stored value |
|---|---|---|---|
| `textInput` | Text input | Text field | `string` |
| `dateInput` | Date input | Date field or date picker | ISO local date string such as `2026-08-31` |
| `currencyInput` | Number input | Currency or numeric field | `number`, or `""` while cleared |
| `textarea` | Multiline textarea | Text area | `string` |
| `dropdown` | Select | Select/combobox | Option `value` string |
| `radioGroup` | Radio inputs | Radio group | Option `value` string |
| `checkboxGroup` | Checkbox inputs | Checkbox group | Ordered `string[]` |
| `editableTable` | Founders table | Table plus internal inputs | Array of founder objects |
| `exceptionList` | Exception editor | Composite form/list | Array of exception objects |
| `finalReviewSummary` | Read-only JSON summary | Summary/presentation component | No direct write |

Confirm these library details before implementation:

- Does the component use `onChange(event)`, `onValueChange(value)`, or another callback?
- Does a cleared field return `undefined`, `null`, or an empty string?
- Does the date component use a string, `Date`, or library-specific date object?
- Does the number component emit a formatted string or a number?
- How are options shaped: `{ value, label }`, `{ id, name }`, or child elements?
- How are invalid state, error text, helper text, required state, and read-only state expressed?
- Does the component generate accessible labels and descriptions, or must the adapter supply IDs?

These differences belong in adapters. They must not leak into page configuration.

## Step 2: Install and Initialize the Internal Library

Add the approved internal package to `frontend/package.json` using the package manager and registry process required by the team.

If the library requires a provider, add it near the application root rather than inside individual fields. For example:

```tsx
import { InternalThemeProvider } from "@company/ui";

root.render(
  <InternalThemeProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </InternalThemeProvider>,
);
```

Keep `frontend/src/main.tsx` limited to bootstrap wiring. If provider composition grows, extract it under `frontend/src/app/`.

Also load any required fonts, tokens, icons, or base styles once. Do not import the same global stylesheet from every field adapter.

## Step 3: Preserve the Existing Field Contract

The current renderer calls `Field` with this contract:

```ts
type FieldProps = {
  node: UiNode;
  value: any;
  onChange: (value: any) => void;
  invalid?: boolean;
};
```

Preserving this contract allows `ScalarField` and the request-data binding to remain unchanged:

```tsx
const ScalarField = ({ node, data, setData, missingPaths, validationActive }: ConfiguredComponentProps) => (
  <Field
    node={node}
    value={node.dataPath ? getPath(data, node.dataPath) : undefined}
    onChange={(value) => node.dataPath && setData((current) => setPath(current, node.dataPath!, value))}
    invalid={Boolean(validationActive && node.dataPath && missingPaths?.has(node.dataPath))}
  />
);
```

This is an important boundary:

- `ScalarField` owns request-data path binding.
- `Field` owns presentation and conversion between the internal component API and the stored value.
- Page config owns semantic metadata.
- Rules own behavior decisions.

## Step 4: Create Adapters for Internal Controls

You can keep the implementation in `Field.tsx` during the first migration. If the file becomes difficult to scan, create focused adapters under:

```text
frontend/src/features/request-renderer/fields/
  InternalTextField.tsx
  InternalDateField.tsx
  InternalCurrencyField.tsx
  InternalSelectField.tsx
  InternalRadioGroupField.tsx
  InternalCheckboxGroupField.tsx
```

Each adapter should accept the DefinitionFlow field contract and translate it to the internal library contract.

### Text input example

```tsx
import { TextField } from "@company/ui";
import type { ScalarAdapterProps } from "./types";

export const InternalTextField = ({ node, value, onChange, invalid }: ScalarAdapterProps) => (
  <TextField
    id={node.id}
    label={node.label}
    value={typeof value === "string" ? value : ""}
    required={node.required}
    disabled={node.disabled}
    invalid={invalid}
    helperText={node.disabled ? "Read-only for the current user and request stage." : node.helperText}
    onValueChange={onChange}
  />
);
```

### Dropdown example

```tsx
import { Select } from "@company/ui";
import { enumOptions } from "../../../config/enumOptions";
import type { ScalarAdapterProps } from "./types";

export const InternalSelectField = ({ node, value, onChange, invalid }: ScalarAdapterProps) => {
  const options = enumOptions[node.dataPath ?? ""] ?? [];

  return (
    <Select
      id={node.id}
      label={node.label}
      options={options}
      value={typeof value === "string" ? value : ""}
      required={node.required}
      disabled={node.disabled}
      invalid={invalid}
      helperText={node.disabled ? "Read-only for the current user and request stage." : node.helperText}
      onValueChange={onChange}
    />
  );
};
```

### Radio-group example

```tsx
import { RadioGroup } from "@company/ui";
import { enumOptions } from "../../../config/enumOptions";
import type { ScalarAdapterProps } from "./types";

export const InternalRadioGroupField = ({ node, value, onChange, invalid }: ScalarAdapterProps) => (
  <RadioGroup
    id={node.id}
    label={node.label}
    options={enumOptions[node.dataPath ?? ""] ?? []}
    value={typeof value === "string" ? value : ""}
    required={node.required}
    disabled={node.disabled}
    invalid={invalid}
    onValueChange={onChange}
  />
);
```

These examples are intentionally adapters, not exact internal-library usage. Match the real library's supported props.

## Step 5: Normalize Values at the Adapter Boundary

Internal controls frequently use value types that differ from request data. Normalize them before calling DefinitionFlow's `onChange`.

### Currency

The stored request value is numeric. Preserve the current empty-field behavior:

```tsx
onValueChange={(nextValue) => {
  onChange(nextValue === "" || nextValue == null ? "" : Number(nextValue));
}}
```

Reject or handle `NaN` according to the internal control contract. Do not store currency symbols or formatted strings in request data.

### Date

The current request format is a local calendar date string:

```text
YYYY-MM-DD
```

If the internal date picker emits a date object, convert it to the local calendar representation expected by the application. Do not use `toISOString()` blindly because UTC conversion can move the date backward or forward for some time zones.

Continue applying configured constraints:

```ts
constraints: {
  maxDate: "today",
}
```

The adapter must translate `"today"` through `localToday()` or pass the equivalent maximum date supported by the internal component.

### Checkbox groups

The stored value is an ordered array of option values. Preserve option-catalog order rather than click order:

```ts
const nextValues = options
  .map((option) => option.value)
  .filter((optionValue) => selectedValues.has(optionValue));
```

This produces stable request patches and predictable tests.

### Cleared values

Keep the current empty values unless the data contract is deliberately changed:

- text/select/radio/date/currency cleared: `""`
- checkbox group cleared: `[]`
- optional collection cleared: follow the existing collection renderer contract

Changing empty-value semantics affects page completion, validation, persistence, and tests. Treat it as a data-contract change, not a visual migration.

## Step 6: Translate Common Field State

Every internal adapter must carry these evaluated properties through:

| DefinitionFlow value | Meaning | Internal component mapping |
|---|---|---|
| `node.label` | User-facing field name | `label`, label child, or associated `<label>` |
| `node.required` | Evaluated required state | `required` plus a visible required indicator |
| `node.disabled` | Evaluated permission/workflow state | `disabled` or approved read-only equivalent |
| `invalid` | Completion/validation failure is active | Invalid/error state and `aria-invalid` |
| `node.helperText` | Configured guidance | Description/helper slot |
| `node.constraints` | Semantic input constraints | `min`, `max`, `step`, maximum date, or library equivalent |

The current UI substitutes this message for helper text when a field is disabled:

```text
Read-only for the current user and request stage.
```

Preserve that behavior unless product copy is intentionally changed.

If the internal library distinguishes `disabled` from `readOnly`, choose deliberately:

- Use `disabled` if the field should be unavailable to interaction and omitted from focus order.
- Use `readOnly` if users should still focus and copy the displayed value.
- Confirm whether the library submits hidden native form values. DefinitionFlow does not rely on browser form submission, but accessibility behavior still matters.

## Step 7: Keep Options in the Existing Catalog

Dropdowns, radio groups, and checkbox groups currently resolve options by `dataPath` from:

```text
frontend/src/config/enumOptions.ts
```

Keep that source of truth during the component migration:

```ts
const options = enumOptions[node.dataPath ?? ""] ?? [];
```

Convert option shape inside the adapter if required:

```ts
const internalOptions = options.map((option) => ({
  id: option.value,
  name: option.label,
}));
```

Do not copy option lists into internal components. Startup validation intentionally fails when an option-based component references a data path without configured options.

## Step 8: Decide Whether a New Component ID Is Necessary

Do not add IDs such as `internalTextInput` or `companySelect`. Replacing the visual implementation is not a new semantic component.

Add a new `UiComponentId` only when the interaction or data contract is genuinely different. Examples might include:

- an entity picker that stores an entity ID and requires remote search;
- a document uploader that stores attachment metadata;
- a money input that stores both amount and currency as an object;
- a domain-specific composite editor.

For a genuine new component:

1. Add the ID to `frontend/src/types/uiComponents.ts`.
2. Create its React renderer under `frontend/src/features/request-renderer/`.
3. Add it to `componentRegistry`.
4. Add any necessary config typing to `UiNode` or a more specific node type.
5. Extend `validateUiDefinition` if the component requires options or other startup checks.
6. Reference the ID from the appropriate page config.
7. Add registry, configuration-validation, and user-behavior tests.

The registry is exhaustive through TypeScript:

```ts
export const componentRegistry = {
  // every UiComponentId must be implemented
} satisfies Record<UiComponentId, ComponentType<ConfiguredComponentProps>>;
```

If an ID is added without an implementation, the frontend build should fail.

## Step 9: Migrate Composite Components Separately

`editableTable`, `exceptionList`, and `finalReviewSummary` are not scalar controls. They have domain-specific rendering and update behavior:

- `FoundersTable.tsx`
- `ExceptionList.tsx`
- the `FinalReviewSummary` renderer in `componentRegistry.tsx`

Migrate these after scalar fields are stable. Reuse internal table, button, select, and input primitives inside the existing domain component instead of forcing the entire editor into a generic field abstraction.

For each composite component, preserve:

- the stored JSON shape;
- add/remove behavior;
- role-specific fields and filtering;
- semantic completion paths;
- inline invalid states;
- stable item IDs;
- current permission behavior.

## Step 10: Keep Layout Out of Page Configuration

This POC intentionally does not make field width, grid columns, spacing, or placement configurable.

Control layout in React and CSS:

- generic field layout in `Field.tsx`, internal adapters, and `frontend/src/styles.css`;
- section layout in `RenderNode.tsx` and section-specific renderer components;
- composite layout inside `FoundersTable.tsx`, `ExceptionList.tsx`, or a new domain component.

Do not add config such as:

```ts
columnSpan: 2
width: "full"
gridArea: "company-stage"
```

If a new section needs a special layout, create a focused React component, own its layout there, and register a semantic component ID only if the section must be selected by configuration.

## Step 11: Test the Migration

Test behavior rather than internal component implementation details.

For every scalar adapter, cover:

- the configured label is visible;
- the current request value is displayed;
- editing emits the correct stored value type;
- cleared values use the expected empty representation;
- `disabled` prevents editing;
- required and invalid states are visible and accessible;
- helper text is associated with the field;
- constraints are forwarded or enforced;
- option labels are displayed while option values are stored.

Example behavior test:

```tsx
it("stores the configured value when company stage changes", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  render(
    <Field
      node={fieldNode({
        component: "radioGroup",
        dataPath: "company.stage",
        label: "Company Stage",
      })}
      value="SEED"
      onChange={onChange}
    />,
  );

  await user.click(screen.getByRole("radio", { name: "Growth" }));

  expect(onChange).toHaveBeenCalledWith("GROWTH");
});
```

Also retain the existing higher-level tests for:

- page completion;
- immediate draft rule evaluation;
- page-scoped save patches;
- workflow validation and actions;
- fail-fast UI-definition validation.

Run:

```bash
cd frontend
npm run test
npm run build
```

Run backend tests too if the stored data shape, API contract, or backend schema changes. A presentation-only component migration should not require backend changes.

## Step 12: Roll Out Incrementally

A safe rollout order is:

1. Add the internal provider and tokens without changing controls.
2. Migrate `textInput` and `textarea`.
3. Migrate `dropdown` and `radioGroup`.
4. Migrate `checkboxGroup`.
5. Migrate `dateInput` and verify time-zone behavior.
6. Migrate `currencyInput` and verify numeric/empty conversion.
7. Migrate domain-specific collection components.
8. Remove unused native-control styles.

Keep each step independently buildable and testable. Avoid changing business rules, data paths, layout behavior, and component-library implementation in the same commit unless they are inseparable.

## Migration Acceptance Checklist

- [ ] Existing page config files are unchanged except for intentional product changes.
- [ ] Existing semantic component IDs still describe behavior rather than a library vendor.
- [ ] Internal-library imports are isolated to renderer/adaptor modules and app-level providers.
- [ ] Rules are still evaluated before rendering.
- [ ] Internal components do not read rule IDs or request paths directly.
- [ ] Request values retain their existing types and empty representations.
- [ ] Date values remain local `YYYY-MM-DD` values.
- [ ] Currency values remain numeric when populated.
- [ ] Option values, not display labels, are persisted.
- [ ] Disabled, required, invalid, helper, and constraint states are preserved.
- [ ] Accessible labels and descriptions are verified.
- [ ] Page-scoped saves still contain only the selected page's data paths.
- [ ] Page completion and workflow validation behave as before.
- [ ] Composite editors preserve their JSON contracts and permissions.
- [ ] Layout remains owned by React components and CSS, not page configuration.
- [ ] Frontend tests and production build pass.

## Common Mistakes to Avoid

### Mapping page config directly to vendor component names

Avoid:

```ts
component: "CompanyDesignSystemRadioGroupV2"
```

Use:

```ts
component: "radioGroup"
```

The registry and adapter decide which internal implementation satisfies that semantic role.

### Letting components fetch or mutate request data directly

Internal components should receive `value` and `onChange`. Keep RTK Query calls and page-scoped persistence in the workbench layer.

### Re-evaluating permissions inside the component

Do not check user roles or workflow state in a generic internal field adapter. Use the evaluated `node.disabled` value.

Domain-specific composite components may still need role-aware behavior when their data model genuinely includes role-specific interactions, as the current exception editor does.

### Changing value shape to match the component library

Adapt the library value to the request contract. Do not change persisted request data merely because a date picker or select uses a different in-memory type.

### Treating visual variants as configuration

Use internal design-system defaults or component-owned code for size, spacing, and placement. Do not expand page configuration into a general-purpose layout DSL.

## File-by-File Implementation Checklist

| File | Typical migration change |
|---|---|
| `frontend/package.json` | Add the approved internal UI dependency |
| `frontend/src/main.tsx` or `frontend/src/app/` | Add a global theme/provider boundary if required |
| `frontend/src/features/request-renderer/Field.tsx` | Replace native scalar controls or delegate to internal adapters |
| `frontend/src/features/request-renderer/fields/*` | Optional focused adapters for internal scalar controls |
| `frontend/src/features/request-renderer/FoundersTable.tsx` | Later migration of collection primitives |
| `frontend/src/features/request-renderer/ExceptionList.tsx` | Later migration of domain-specific exception inputs |
| `frontend/src/features/request-renderer/componentRegistry.tsx` | Usually unchanged for scalar migration; register only genuinely new semantics |
| `frontend/src/types/uiComponents.ts` | Usually unchanged; add only genuinely new semantic IDs |
| `frontend/src/config/enumOptions.ts` | Usually unchanged; remains the option source |
| `frontend/src/config/pages/*.ts` | No migration-only changes expected |
| `frontend/src/styles.css` | Remove obsolete native styles after migration parity |
| `frontend/src/features/request-renderer/*.test.tsx` | Add adapter and integration behavior coverage |

The key design principle is simple: page configuration selects a semantic UI capability, and the registry plus adapter layer decides how the company's internal design system implements that capability.
