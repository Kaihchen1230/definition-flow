export type Actor = {
  id: string;
  displayName: string;
  role: string;
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
  visibleRule?: string;
  enabledRule?: string;
  filter?: { path: string; op: string; value: string };
  debug?: Record<string, unknown>;
  children?: UiNode[];
  actions?: UiNode[];
  actionType?: string;
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

export type EvaluatedUi = {
  requestCaseId: string;
  requestType: string;
  workflowState: string;
  actor: { userId: string; displayName: string; role: string; entitlements: string[] };
  requestData: Record<string, any>;
  derived: Record<string, unknown>;
  calculations: Record<string, any>;
  definitionVersions: Record<string, number>;
  canSave: boolean;
  pages: UiNode[];
  workflowActions: WorkflowAction[];
  validation: {
    submit: ValidationIssue[];
    approve: ValidationIssue[];
    render: ValidationIssue[];
  };
};
