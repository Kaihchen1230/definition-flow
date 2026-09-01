import { investmentLevels, riskLevels } from "./approvalLevels";

const levelWorkflowActionRules = (area: "Investment" | "Risk", levels: readonly string[]) => {
  const rules: Record<string, string> = {};
  levels.forEach((_level, index) => {
    const levelNumber = index + 1;
    rules[`workflow.submit${area}ReviewLevel${levelNumber}`] = `canSubmit${area}Level${levelNumber}`;
    rules[`workflow.approve${area}Level${levelNumber}Complete`] = `canApprove${area}Level${levelNumber}Complete`;
    levels.slice(index + 1).forEach((_targetLevel, targetOffset) => {
      const targetNumber = index + targetOffset + 2;
      rules[`workflow.approve${area}Level${levelNumber}ToLevel${targetNumber}`] = `canApprove${area}Level${levelNumber}ToLevel${targetNumber}`;
    });
  });
  return rules;
};

/**
 * Maps backend transition IDs to frontend capability rule IDs and supplies
 * readable fallback labels. Unmapped transitions deliberately fail closed.
 */
export const startupInvestmentWorkflowActionRules: Record<string, string | null> = {
  "workflow.startInvestmentReview": "canEditInvestmentReview",
  ...levelWorkflowActionRules("Investment", investmentLevels),
  ...levelWorkflowActionRules("Risk", riskLevels),
  "workflow.decline": "canDeclineRequest",
  "workflow.withdraw": "canWithdrawRequest",
};

export const resolveWorkflowActionLabel = (actionId: string, providedLabel: string) => {
  if (providedLabel.trim() && providedLabel !== actionId) {
    return providedLabel;
  }
  const submit = /^workflow\.submit(Investment|Risk)ReviewLevel(\d)$/.exec(actionId);
  if (submit) {
    return `Submit to ${submit[1]} Level ${submit[2]}`;
  }
  const approveNext = /^workflow\.approve(Investment|Risk)Level(\d)ToLevel(\d)$/.exec(actionId);
  if (approveNext) {
    return `Approve ${approveNext[1]} Level ${approveNext[2]} and continue to Level ${approveNext[3]}`;
  }
  const approveComplete = /^workflow\.approve(Investment|Risk)Level(\d)Complete$/.exec(actionId);
  if (approveComplete) {
    return `Approve as ${approveComplete[1]} Level ${approveComplete[2]}`;
  }
  return {
    "workflow.startInvestmentReview": "Start investment review",
    "workflow.submitInvestmentReview": "Submit for investment approval",
    "workflow.submitRiskReview": "Submit for risk approval",
    "workflow.decline": "Decline request",
    "workflow.withdraw": "Withdraw request",
  }[actionId] ?? "Unavailable action";
};
