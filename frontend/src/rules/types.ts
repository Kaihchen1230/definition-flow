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

export type FrontendRuleDefinition = {
  capabilities: Record<string, NamedRuleDefinition>;
  uiRules: Record<string, NamedRuleDefinition>;
  actionRules: Record<string, NamedRuleDefinition>;
  validationRules: Record<string, ValidationRuleDefinition>;
};

export type DerivedFactDefinition = {
  description: string;
  defaultValue: unknown;
  cases: Array<{ value: unknown; when: RuleNode }>;
};
