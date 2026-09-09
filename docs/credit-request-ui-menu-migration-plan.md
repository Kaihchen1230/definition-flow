# Credit Request UI: Configurable Menu Migration Plan

## Purpose

Migrate `credit-request-ui` from its current menu implementation to a configuration-driven navigation model similar to DefinitionFlow, beginning with menu groups and page visibility.

The first business requirement is:

> General Information contains a **Same as Main Account** checkbox. When selected, General Information remains visible and every other menu item and submenu is hidden. When cleared, the applicable menu items return.

This document is written as an implementation handoff for a coding agent working inside the UBS repository. The agent must inspect the repository before choosing names or locations; this plan deliberately describes responsibilities and interfaces rather than guessing UBS-specific paths.

## Required Outcome

After the migration:

- Menu structure and ordering come from one declarative definition.
- Each navigable page has a stable ID, label, route, and optional visibility rule.
- Visibility is evaluated from the current credit-request draft and user/workflow context.
- Parent groups are automatically hidden when they have no visible children.
- General Information remains visible when **Same as Main Account** is selected.
- Every other configured page becomes hidden immediately when that checkbox is selected.
- Clearing the checkbox restores the pages allowed by all other conditions.
- A hidden page cannot remain active or be reached by a direct URL.
- Hidden pages do not contribute to menu completion or block submission validation.
- Previously entered hidden-page data is retained unless an approved business rule explicitly requires clearing it.
- Authorization remains enforced by the appropriate backend or platform policy layer. Hiding a menu is not authorization.

## Guiding Design

Create a navigation module with a small interface and place all menu-specific complexity behind it.

Callers should provide:

1. An ordered navigation definition.
2. The current evaluation context.
3. Completion results keyed by page ID, if completion is shown in the menu.

Callers should receive:

1. Ordered visible groups.
2. Ordered visible pages within each group.
3. A flattened visible-page sequence.
4. The active page's group.
5. Previous and next page IDs.
6. A safe fallback page when the requested page is hidden or unknown.

The sidebar renderer should not evaluate business rules, inspect request fields, decide group visibility, or calculate navigation order. It should render the evaluated navigation model and emit user intent.

This creates a durable seam: future conditions can change without rewriting the sidebar or scattering visibility logic across route declarations and React markup.

## Assumptions to Verify Before Coding

The coding agent must confirm each item in the UBS repository and record any mismatch in the PR description:

- The frontend framework and router currently used.
- Whether menu definitions and route definitions are shared or duplicated.
- Where the credit-request draft lives and how field changes become observable.
- The actual persisted path and type for **Same as Main Account**.
- Whether the checkbox applies only to the active credit request or also to related entities.
- Whether the application supports multiple credit-request types with different menus.
- Whether menu visibility is currently influenced by product, legal entity, workflow state, role, entitlement, feature flag, or jurisdiction.
- Whether menu items display completion, warnings, errors, or badges.
- How unsaved changes are guarded during navigation.
- What happens today when the active route becomes invalid after data changes.
- Whether validation is frontend-only, backend-only, or evaluated in both places.
- Whether hidden fields are submitted, ignored, or removed by the backend.
- Existing accessibility and analytics conventions for navigation.
- Existing tests at the router, menu, form, validation, and submission seams.

Do not start by introducing new abstractions if the repository already has an equivalent rule evaluator, route metadata model, or menu-definition module. Extend the existing seam when it is coherent.

## Domain Terminology

Use names aligned with the UBS domain model. Recommended concepts are:

| Concept | Meaning |
| --- | --- |
| Navigation definition | Ordered, unevaluated configuration for groups and pages |
| Navigation group | Presentation grouping that owns an ordered list of pages |
| Navigation page | A routable credit-request page shown as a menu item or submenu |
| Visibility rule | A named condition deciding whether a page participates in navigation |
| Evaluation context | Current draft data, user, entitlements, workflow state, and relevant feature context |
| Evaluated navigation | Render-ready visible groups and pages |
| Stable page ID | Persistent identity used for rules, completion, validation, analytics, and tests |

Avoid calling page configuration `children` if `children` already means fields or sections inside a page. Prefer `groups[].pages[]` for navigation and reserve `children` for page content when that matches the existing UI model.

## Target Navigation Model

The exact language syntax should match the repository, but the model must express these facts:

### Navigation group

- Stable group ID
- User-facing label or translation key
- Ordered pages
- No independent visibility rule in the first version

### Navigation page

- Stable page ID
- User-facing label or translation key
- Route identifier or route destination
- Optional named visibility rule
- Optional completion or validation metadata only if already needed by the menu

### Visibility rules

- Named by business meaning, not by a particular menu item
- Pure and deterministic for a supplied evaluation context
- Default to visible when no rule is configured
- Fail closed for an unknown configured rule in production builds
- Fail fast during development and automated validation

### Same-as-main-account condition

Define one positively named business condition such as:

- `showAccountSpecificPages`, or
- a domain-approved equivalent

Its behavior is:

| Checkbox value | Result |
| --- | --- |
| `true` | Hide every page except General Information |
| `false` | Show pages allowed by their other conditions |
| absent during migration | Treat as `false` unless product requirements say otherwise |

Avoid a name such as `hidePagesWhenSameAsMainAccount`; positive names reduce double-negative configuration and validation rules.

## Visibility Composition

If a page already has another visibility condition, do not replace it. Compose the conditions:

> Page is visible when account-specific pages are allowed **and** the page's existing business condition passes.

Examples include product eligibility, role, workflow state, jurisdiction, or feature flag. The migration must preserve those conditions.

The coding agent should choose one of these approaches based on existing repository conventions:

1. Named rules can reference other named rules and compose them.
2. The page definition supports an explicit list of conditions with `all` semantics.
3. A domain-specific combined named rule is added for that page.

Do not embed ad hoc checkbox checks in each sidebar JSX branch.

## Group Visibility

Do not configure the checkbox separately on every group in the first version.

Instead:

1. Evaluate child-page visibility.
2. Remove hidden pages.
3. Remove any group left with zero visible pages.

This prevents contradictory states such as a visible empty group or a hidden group containing a visible route.

If General Information shares a group with other pages, that group remains visible with only General Information when the checkbox is selected.

## Active Page and Routing Rules

Menu hiding alone is insufficient. The router and active-page state must follow the same evaluated navigation result.

Required behavior:

- If the current page remains visible, preserve it.
- If the current page becomes hidden, navigate to General Information using a replace-style navigation so browser history does not retain an invalid active entry.
- If a user opens a hidden page through a bookmark or direct URL, redirect to General Information.
- Browser Back and Forward must not expose a hidden page.
- If the checkbox is cleared, restored pages become navigable again; do not automatically leave General Information.
- Existing save-before-navigation protection must remain intact for user-initiated menu changes.
- A visibility-driven redirect must have an explicit policy for unsaved data. For this requirement, the checkbox is changed on General Information, so save or autosave that page according to the existing form lifecycle before relying on the persisted value.

Keep route authorization separate. A route can be hidden for relevance while still authorized, or unauthorized regardless of menu visibility.

## Draft Evaluation Behavior

The menu should react to the current frontend draft, not only to the last server response.

Expected sequence:

1. User selects **Same as Main Account**.
2. The General Information draft updates.
3. The evaluation context updates.
4. Navigation visibility is reevaluated.
5. Other pages and empty groups disappear immediately.
6. General Information completion and validation update.
7. The existing persistence mechanism saves the value.

On save failure, display the existing error treatment. Product owners must decide whether the immediately hidden menu remains based on the draft or reverts to the persisted value. Recommended default: retain the draft and hidden-menu state while clearly showing that saving failed, because silently reverting the checkbox is more surprising.

## Completion and Validation Semantics

This is the most important nonvisual part of the migration.

### Completion

- Calculate page and group completion from visible pages only.
- A hidden page must not make its former group incomplete.
- General Information still participates normally.
- When the checkbox is cleared, restored pages resume contributing to completion.

### Validation

Hiding a page does not automatically make its field-level or workflow validation irrelevant unless the validation module explicitly uses visibility.

Every validation rule owned by an account-specific page must be reviewed. It should pass or be excluded when `showAccountSpecificPages` is false, unless the business explicitly requires that value even when its page is hidden.

Required test:

> A request with **Same as Main Account** selected can proceed without completing any hidden page, provided General Information and all still-applicable business requirements are valid.

Do not infer validation applicability from rendered DOM. Use the same named business condition or an evaluated-page applicability result.

## Hidden Data Policy

Recommended behavior:

- Retain data previously entered on pages that become hidden.
- Exclude hidden pages from completion and applicable validation.
- Ensure the backend understands the checkbox as the authoritative indicator that account-specific values are inherited or not applicable.
- Restore retained values if the checkbox is cleared.

Reasons:

- Toggling the checkbox does not destroy user work.
- Accidental clicks are recoverable.
- The frontend does not issue a large destructive patch.
- Audit history remains understandable.

Only clear hidden data if compliance, privacy, or downstream contract requirements explicitly demand it. If clearing is required, use a confirmed domain operation with backend support and audit it; do not clear data as an incidental React effect.

## Security and Entitlements

Menu visibility is presentation behavior, not an access-control mechanism.

The migration must preserve existing authorization checks. In particular:

- Direct URL access must still be authorized.
- Backend mutation and read policies must still enforce entitlements.
- The checkbox must not grant access to General Information or any other page.
- Visibility rules may consume entitlement information for UX, but must not become the sole security control in a production banking application.

Do not copy DefinitionFlow's explicit POC decision to trust frontend permission decisions unless UBS architecture has separately approved that decision.

## Configuration Validation

Add startup, build-time, or test-time validation for the assembled navigation definition.

Validate at least:

- Unique group IDs
- Unique page IDs across all groups
- Nonempty configured groups
- Valid route destinations
- Known visibility rule IDs
- A General Information page exists
- At least one page remains visible for every supported request context
- Stable IDs do not collide with field or section IDs if those share a namespace
- Translation keys exist, if labels are localized

An unknown rule or route should not produce a partially working menu.

## Migration Strategy

Use replacement rather than long-term layering. A temporary adapter is acceptable while migrating, but remove the legacy menu assembly after parity is proven.

### Phase 1: Characterize the existing behavior

Before structural changes:

- Add or identify behavior tests that capture current menu groups, items, order, labels, active styling, navigation, save guards, route handling, accessibility, and existing conditional behavior.
- Capture representative menus for major credit-request types and roles.
- Document any current inconsistencies rather than silently treating them as intended behavior.

Exit criterion: the team can detect an accidental change to today's menu.

### Phase 2: Introduce the navigation definition without behavior changes

- Define stable group and page identities.
- Represent the existing menu order declaratively.
- Keep every page visible by default.
- Include the existing route destination and label source.
- Add definition validation.
- Adapt the current menu renderer to consume the definition or its evaluated result.

Exit criterion: screenshots and behavior tests show the same menu for existing scenarios.

### Phase 3: Introduce the navigation module

- Add a pure operation that evaluates configured page visibility.
- Derive visible groups from visible pages.
- Provide flattened visible-page order.
- Resolve active group and adjacent pages if required.
- Resolve a safe fallback page.
- Keep the sidebar focused on rendering.

Exit criterion: navigation behavior is tested through the module's public interface, and the sidebar contains no credit-request business predicates.

### Phase 4: Add the checkbox to General Information

- Add the boolean to the frontend domain model and backend contract where required.
- Add it to defaults and migration handling so older requests have deterministic behavior.
- Render the checkbox using the existing form framework.
- Save it through the existing page-scoped or form-scoped persistence mechanism.
- Confirm audit and serialization behavior.

Exit criterion: selecting and clearing the checkbox persists correctly without changing menu visibility yet.

### Phase 5: Add conditional menu visibility

- Add the named `showAccountSpecificPages` condition.
- Attach it to every page except General Information.
- Compose it with preexisting visibility conditions.
- Reevaluate from the current draft.
- Automatically remove empty groups.
- Add the hidden-route fallback.

Exit criterion: selecting the checkbox leaves only General Information visible and clearing it restores applicable pages.

### Phase 6: Align completion and validation

- Exclude hidden pages from completion aggregation.
- Guard page-specific validation with the same business condition.
- Verify submit behavior for checked and unchecked cases.
- Verify existing hidden data does not generate invisible errors.

Exit criterion: the user is never blocked by a requirement they cannot see, and restored pages correctly regain completion and validation responsibilities.

### Phase 7: Remove the legacy implementation

- Delete obsolete menu arrays, JSX branches, and duplicated route metadata.
- Remove temporary adapters and feature flags once rollout criteria are satisfied.
- Update architecture and contributor documentation.
- Confirm analytics and accessibility parity.

Exit criterion: one assembled navigation definition and one navigation module own the behavior.

## Tiny Commit Plan

Each commit should leave the application buildable and existing behavior working.

1. **test: characterize the existing credit-request menu**
   Add behavior tests for current groups, page order, navigation, active state, and any current conditions. Do not refactor yet.

2. **refactor: assign stable identities to current menu pages**
   Introduce or consolidate stable page and group IDs without changing rendered output.

3. **refactor: describe the existing menu as an ordered definition**
   Move static labels, routes, grouping, and ordering into one definition. Keep all pages visible.

4. **test: validate malformed navigation definitions**
   Cover duplicate IDs, empty groups, unknown routes, and unknown rule references.

5. **refactor: add the evaluated-navigation module**
   Implement visible-page filtering, empty-group removal, flattened order, group lookup, and fallback selection as pure behavior.

6. **refactor: render the sidebar from evaluated navigation**
   Replace legacy menu assembly while preserving visual and interaction behavior.

7. **refactor: enforce evaluated navigation at the router seam**
   Redirect unknown or hidden page destinations to General Information and cover browser history behavior.

8. **feat: persist Same as Main Account on General Information**
   Add the checkbox and persistence contract without changing navigation.

9. **test: define account-specific navigation scenarios**
   Add failing behavior tests for checked, unchecked, absent legacy value, and checkbox toggling.

10. **feat: add the account-specific page visibility condition**
    Define the named rule and attach it to every non-General-Information page while composing existing conditions.

11. **feat: exclude hidden pages from completion**
    Update aggregation and group status behavior with focused tests.

12. **feat: exclude inapplicable hidden-page validation**
    Guard or filter validation and add submission-level tests.

13. **test: cover retained data and restored navigation**
    Verify values survive checked-to-unchecked toggles and restored pages regain their state.

14. **test: cover roles, request types, and direct URLs**
    Exercise the representative UBS matrix and ensure authorization remains independent.

15. **docs: document configurable credit-request navigation**
    Explain ownership, ordering, visibility rules, hidden-data policy, validation synchronization, and extension steps.

16. **refactor: remove the legacy menu path**
    Delete temporary adapters, duplicate definitions, and obsolete tests only after parity and rollout checks pass.

If the repository already has stable IDs, a suitable rule evaluator, or a single route definition, collapse the corresponding preparatory commits instead of duplicating those concepts.

## Test Plan

Prefer behavior tests at public seams rather than snapshots of internal objects.

### Definition tests

- Preserves configured group order followed by page order.
- Rejects duplicate group IDs.
- Rejects duplicate page IDs across groups.
- Rejects empty configured groups if the chosen invariant requires them to start nonempty.
- Rejects unknown visibility rules.
- Rejects unknown route destinations.

### Navigation module tests

- No rule means visible.
- Checked checkbox hides all non-General-Information pages.
- Unchecked checkbox restores applicable pages.
- Missing legacy value behaves like unchecked.
- Existing page conditions compose with the checkbox condition.
- Groups with no visible pages are absent.
- Groups with General Information remain visible.
- Flattened page order skips hidden pages.
- A hidden active page resolves to General Information.
- A visible active page remains active.

### UI integration tests

- Checkbox changes the menu immediately from draft state.
- No empty group headings remain.
- Focus moves predictably after a visibility-driven navigation change.
- Browser Back does not reopen a hidden page.
- Direct navigation to a hidden page redirects safely.
- Clearing the checkbox restores menu items without forcing navigation away from General Information.
- Existing mobile and responsive menu behavior remains intact.
- Screen readers receive correct expanded, current-page, and label semantics.

### Completion tests

- Hidden pages do not count toward group or request completion.
- General Information still reports missing required data.
- Restored pages resume affecting completion.
- Completion badges aggregate only visible children.

### Validation and submission tests

- Checked request submits without hidden-page fields when all applicable requirements pass.
- Hidden-page validation produces no inaccessible error.
- Unchecked request remains blocked by incomplete required pages.
- Existing values on hidden pages are retained.
- Clearing the checkbox restores validation for those pages.
- Backend validation, if present, uses the same applicability semantics.

### Security tests

- Hiding a page does not alter entitlements.
- Unauthorized direct access remains rejected.
- Authorized but inapplicable pages redirect rather than expose stale content.
- Mutation authorization is unchanged.

## Acceptance Criteria

- [ ] General Information includes a persisted **Same as Main Account** checkbox.
- [ ] General Information is always visible for an authorized credit request.
- [ ] Selecting the checkbox immediately hides every other menu item and submenu.
- [ ] Every group with no visible pages is hidden.
- [ ] Clearing the checkbox restores pages allowed by other conditions.
- [ ] Existing page ordering is preserved.
- [ ] Hidden pages cannot be opened through menu interaction, direct URL, or browser history.
- [ ] Hidden pages do not affect completion.
- [ ] Hidden pages do not create submission-blocking errors.
- [ ] Previously entered hidden-page data is retained unless an approved requirement says otherwise.
- [ ] Existing save-before-navigation behavior remains correct.
- [ ] Existing role and entitlement behavior remains correct.
- [ ] Navigation configuration is validated for IDs, rules, and routes.
- [ ] Tests cover draft toggling, persisted loading, routing, completion, validation, and security.
- [ ] Documentation explains how to add a new conditional page.
- [ ] Legacy menu assembly is removed after migration parity is proven.

## Rollout and Rollback

For a high-impact application, use a temporary feature flag or controlled rollout if UBS conventions support it.

Recommended rollout:

1. Ship the configuration-driven menu with conditions disabled and compare it with the legacy result in tests or nonproduction telemetry.
2. Enable the new renderer for internal test users.
3. Enable the checkbox persistence without visibility changes.
4. Enable conditional visibility in a lower environment.
5. Validate representative request types, roles, and migrated requests.
6. Roll out broadly.
7. Remove the legacy path and temporary flag after the observation period.

Rollback must be able to restore the previous menu without deleting the checkbox value or hidden-page data. Avoid schema changes that make the old frontend unable to read requests containing the new boolean.

## Observability

Use existing UBS telemetry conventions. Useful events or diagnostics include:

- Checkbox selected or cleared
- Visibility-driven redirect to General Information
- Attempted direct navigation to an inapplicable page
- Unknown configured rule or route
- Save failure after the checkbox changes
- Submission blocked by an error associated with a hidden page; this should be zero

Do not log sensitive credit-request values merely to diagnose navigation.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Hidden pages still block submission | Guard validation with the same applicability condition and add workflow-level tests |
| Active hidden route remains rendered | Enforce evaluated navigation at the router seam and use a safe fallback |
| Existing page conditions are overwritten | Compose conditions and test representative request types and roles |
| Users lose entered data after toggling | Retain hidden data and avoid destructive frontend effects |
| Menu hiding is mistaken for security | Preserve backend authorization and direct-route enforcement |
| Definition and route metadata drift | Validate routes and keep one assembled source of navigation truth |
| Large one-shot rewrite is difficult to review | Follow the tiny commit plan and prove parity before behavior changes |
| Missing legacy checkbox value changes old requests | Define absent as unchecked and test migrated data |

## Out of Scope for the Initial Migration

- Dynamically changing group labels or page labels
- Reordering pages based on request data
- Independent visibility rules on parent groups
- Remote business-user authoring of menu configuration
- Replacing the existing form engine
- Replacing the existing router
- Replacing backend authorization
- Automatically deleting data from hidden pages
- Migrating all field and section rendering into a DefinitionFlow-style schema

These may be evaluated later. The initial seam should not prevent them, but they should not enlarge this migration.

## Decisions Requiring Product or Architecture Confirmation

Before merging the behavioral commits, obtain explicit answers to:

1. Does **Same as Main Account** mean all non-General-Information pages are inapplicable for every credit-request type?
2. Should any summary, review, document, or submission page remain visible?
3. Should hidden-page data be retained, ignored downstream, or cleared?
4. Is checkbox behavior immediate on draft change or only after save?
5. What should happen if saving the checkbox fails?
6. Does the backend already understand the inheritance semantics represented by the checkbox?
7. Must generated documents or downstream payloads omit hidden-page values?
8. Are there regulatory or jurisdiction-specific pages that must remain visible regardless of the checkbox?
9. Which layer owns authorization for direct routes and mutations?
10. Is a feature flag required for rollout?

## Instructions for the UBS Coding Agent

1. Read the repository's contributor instructions first.
2. Perform the discovery checklist and summarize the current menu, routing, state, validation, and test architecture.
3. Map existing modules to the responsibilities in this plan; do not invent parallel systems when a suitable seam already exists.
4. Ask for answers to unresolved product or architecture decisions before implementing destructive data behavior or changing authorization.
5. Create a feature branch from the current default branch.
6. Follow the tiny commit plan, adapting commit boundaries only where the existing architecture makes a step unnecessary.
7. Keep every commit buildable and behaviorally verified.
8. Preserve current behavior until the explicit checkbox-visibility commit.
9. Add tests at public seams before deleting legacy behavior.
10. Update relevant architecture and contributor documentation.
11. In the PR description, list assumptions, deviations from this plan, tests run, rollout strategy, and any remaining risks.

The implementation is complete only when the sidebar, router, completion logic, and validation all agree on the same evaluated set of applicable pages.
