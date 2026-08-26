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

export type UiNode = {
  id: string;
  type: string;
  component?: string;
  label?: string;
  dataPath?: string;
  value?: unknown;
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  visibleRule: string | null;
  enabledRule: string | null;
  required: boolean;
  requiredRule: string | null;
  filter?: { path: string; op: string; value: string };
  debug?: Record<string, unknown>;
  children?: UiNode[];
  actions?: UiNode[];
  requiredFields?: string[];
  actionType?: string;
  calculationId?: string;
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
  visible: boolean;
  enabled: boolean;
  disabled: boolean;
  debug?: Record<string, unknown>;
};

export type EvaluationContext = {
  requestCaseId: string;
  requestType: string;
  workflowState: string;
  user: { userId: string; displayName: string; role: string; entitlements: string[] };
  requestData: Record<string, any>;
  derived: Record<string, unknown>;
  calculations: Record<string, any>;
  definitionVersions: Record<string, number>;
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
