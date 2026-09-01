export type RuleOperator =
  | "eq"
  | "neq"
  | "in"
  | "notIn"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "exists"
  | "missing"
  | "empty"
  | "notEmpty"
  | "count"
  | "minCount"
  | "maxCount";

export type PredicateRule = { path: string; op: RuleOperator; value?: unknown };
export type RuleNode =
  | PredicateRule
  | { rule: string }
  | { and: RuleNode[] }
  | { or: RuleNode[] }
  | { not: RuleNode }
  | { allItems: CollectionRule }
  | { anyItem: CollectionRule }
  | { noItems: CollectionRule };

export type CollectionRule = {
  path: string;
  where?: RuleNode;
  rule: RuleNode;
};

export type NamedRuleDefinition = {
  description: string;
  rule: RuleNode;
};

export type ValidationRuleDefinition = NamedRuleDefinition & {
  scope: ValidationScope[];
  severity: "blocking" | "warning";
  pageId: string | null;
  nodeId: string | null;
  message: string;
};

export type ValidationScope = "render" | "submit" | "riskSubmit" | "approve";

/**
 * Organizes frontend rules by business meaning. Evaluation merges every bucket
 * into one named-rule catalog, so the UI property that references a rule still
 * determines its effect: visibleRule controls visibility, enabledRule controls
 * editability, and requiredRule controls conditional required state.
 */
export type FrontendRuleDefinition = {
  /** User permissions and workflow-state authority, such as edit, approve, or withdraw. */
  capabilities: Record<string, NamedRuleDefinition>;
  /** Presentation conditions, such as whether a field, section, or page should appear or be required. */
  uiRules: Record<string, NamedRuleDefinition>;
  /** Eligibility for configured UI commands that are not mapped workflow transitions. */
  actionRules: Record<string, NamedRuleDefinition>;
  /** Conditions that report issues and can block the configured validation scopes. */
  validationRules: Record<string, ValidationRuleDefinition>;
};

/**
 * Defines a reusable value calculated from the current evaluation context.
 * Cases are checked in order; the first matching `when` supplies the value.
 * The default is used when no case matches.
 */
export type DerivedFactDefinition = {
  /** Explains the business meaning of the calculated value. */
  description: string;
  /** Fallback value returned when none of the configured cases match. */
  defaultValue: unknown;
  /** Ordered candidate values and the rule that activates each one. */
  cases: Array<{ value: unknown; when: RuleNode }>;
};
