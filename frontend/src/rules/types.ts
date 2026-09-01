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
 * Organizes named frontend rules by business responsibility. The evaluator
 * combines these buckets for rule references; the UI property using a rule
 * determines whether it controls visibility, required state, or editability.
 */
export type FrontendRuleDefinition = {
  /** User authority derived from identity, entitlements, and workflow state. */
  capabilities: Record<string, NamedRuleDefinition>;
  /** Presentation conditions consumed by visibleRule and requiredRule. */
  uiRules: Record<string, NamedRuleDefinition>;
  /** Eligibility for configured non-workflow UI commands. */
  actionRules: Record<string, NamedRuleDefinition>;
  /** User-facing issues evaluated for one or more validation scopes. */
  validationRules: Record<string, ValidationRuleDefinition>;
};

/**
 * Describes a reusable value calculated from the current evaluation context.
 * Cases are checked in order, and the first matching case supplies the value.
 */
export type DerivedFactDefinition = {
  /** Explains the business meaning of the calculated value. */
  description: string;
  /** Used when none of the configured cases match. */
  defaultValue: unknown;
  /** Ordered candidate values and the rule that activates each candidate. */
  cases: Array<{ value: unknown; when: RuleNode }>;
};
