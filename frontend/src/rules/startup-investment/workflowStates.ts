/** Workflow-state sets shared by presentation rules for the startup-investment domain. */
export const pendingRiskApprovalStates = () => [
  "PENDING_RISK_APPROVAL_LEVEL_1",
  "PENDING_RISK_APPROVAL_LEVEL_2",
  "PENDING_RISK_APPROVAL_LEVEL_3",
  "PENDING_RISK_APPROVAL_LEVEL_4",
];

export const riskWorkflowStates = () => [
  "RISK_REVIEW",
  ...pendingRiskApprovalStates(),
  "APPROVED",
  "DECLINED",
];
