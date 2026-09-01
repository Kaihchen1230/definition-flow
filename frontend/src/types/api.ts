import type { UiComponentId } from "./uiComponents";

export type User = {
  id: string;
  displayName: string;
  role: string;
};

export type DemoRequest = {
  id: string;
  label: string;
  scenario: string;
  companyName: string;
  workflowState: string;
};

export type CreatedRequest = {
  id: string;
  requestType: string;
  workflowState: string;
};

export type UiRuleReference = string | null;

export type FieldConstraints = {
  min?: number;
  max?: number;
  step?: number;
  currency?: string;
  maxDate?: "today" | string;
  allowedValues?: readonly string[];
};

export type UiNode = {
  id: string;
  type: string;
  component?: UiComponentId;
  label?: string;
  helperText?: string;
  dataPath?: string;
  value?: unknown;
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  visibleRule: UiRuleReference;
  enabledRule: UiRuleReference;
  required: boolean;
  requiredRule: UiRuleReference;
  filter?: { path: string; op: string; value: string };
  debug?: Record<string, unknown>;
  children?: UiNode[];
  actions?: UiNode[];
  requiredFields?: string[];
  requiredFieldRules?: Record<string, UiRuleReference>;
  actionType?: string;
  calculationId?: string;
  constraints?: FieldConstraints;
  itemConstraints?: Record<string, FieldConstraints>;
  collectionConstraints?: {
    sum?: { field: string; max?: number; min?: number };
  };
};

export type RuleTraceEntry = {
  ruleId: string | null;
  path: string | null;
  op: string | null;
  expected: unknown;
  actual: unknown;
  result: boolean;
  status: string;
};

export type RuleEvaluationResult = {
  result: boolean;
  trace: RuleTraceEntry[];
};

export type ValidationIssue = {
  ruleId: string;
  severity: string;
  message: string;
  path: string;
  pageId?: string;
};

export type WorkflowAction = {
  id: string;
  label: string;
  enabledRule: string | null;
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  debug?: Record<string, unknown>;
};

export type WorkflowActionDefinition = {
  id: string;
  label: string;
};

export type RawEvaluationContext = {
  requestCaseId: string;
  requestType: string;
  workflowState: string;
  user: { userId: string; displayName: string; role: string; entitlements: string[] };
  requestData: Record<string, any>;
  calculations: Record<string, any>;
  definitionVersions: Record<string, number>;
  workflowActions: WorkflowActionDefinition[];
};

export type EvaluationContext = Omit<RawEvaluationContext, "workflowActions"> & {
  derived: Record<string, unknown>;
  canSave: boolean;
  ruleResults: Record<string, RuleEvaluationResult>;
  workflowActions: WorkflowAction[];
  validation: {
    submit: ValidationIssue[];
    riskSubmit: ValidationIssue[];
    approve: ValidationIssue[];
    render: ValidationIssue[];
  };
};

export type EvaluatedUi = EvaluationContext & {
  pages: UiNode[];
};

export type RequestDataUpdate = {
  path: string;
  value: any;
};
