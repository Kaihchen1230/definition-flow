import type { NamedRuleDefinition, RuleNode } from "../types";
import { investmentLevels, riskLevels } from "./approvalLevels";

const containsLevel = (path: string, level: string): RuleNode => ({
  path: `requestData.${path}`,
  op: "contains",
  value: level,
});

const excludesLevel = (path: string, level: string): RuleNode => ({
  not: containsLevel(path, level),
});

const levelCapabilities = (area: "Investment" | "Risk", editorRule: string, path: string, statePrefix: string, entitlementPrefix: string, levels: readonly string[]) => {
  const capabilities: Record<string, NamedRuleDefinition> = {};
  levels.forEach((level, index) => {
    const levelNumber = index + 1;
    capabilities[`canSubmit${area}Level${levelNumber}`] = {
      description: `Submit to the first selected ${area.toLowerCase()} approval level.`,
      rule: { and: [{ rule: editorRule }, containsLevel(path, level), ...levels.slice(0, index).map((lowerLevel) => excludesLevel(path, lowerLevel))] },
    };
    const approvalBase: RuleNode[] = [
      { path: "workflow.state", op: "eq", value: `${statePrefix}_${level}` },
      { path: "user.entitlements", op: "contains", value: `${entitlementPrefix}_${level}` },
      containsLevel(path, level),
    ];
    capabilities[`canApprove${area}Level${levelNumber}Complete`] = {
      description: `Complete ${area.toLowerCase()} approval when no higher selected level remains.`,
      rule: { and: [...approvalBase, ...levels.slice(index + 1).map((higherLevel) => excludesLevel(path, higherLevel))] },
    };
    levels.slice(index + 1).forEach((targetLevel, targetOffset) => {
      const targetIndex = index + targetOffset + 1;
      capabilities[`canApprove${area}Level${levelNumber}ToLevel${targetIndex + 1}`] = {
        description: `Continue ${area.toLowerCase()} approval to the next selected level.`,
        rule: { and: [...approvalBase, containsLevel(path, targetLevel), ...levels.slice(index + 1, targetIndex).map((intermediateLevel) => excludesLevel(path, intermediateLevel))] },
      };
    });
  });
  return capabilities;
};

/**
 * Defines what the current user may do from their entitlements and workflow
 * state. UI editability and workflow-action mappings reference these rule IDs.
 */
export const startupInvestmentCapabilities = {
  // DEMO: uncomment this rule, then point investmentAmount.enabledRule to it.
  // canEditInvestmentAmount: {
  //   description: "Investment analysts can edit the amount only during investment review.",
  //   rule: {
  //     and: [
  //       { path: "workflow.state", op: "eq", value: "INVESTMENT_REVIEW" },
  //       { path: "user.role", op: "eq", value: "InvestmentAnalyst" },
  //       { path: "user.entitlements", op: "contains", value: "EDIT_INVESTMENT_REQUEST" },
  //     ],
  //   },
  // },
  canEditInvestmentReview: {
    description: "Investment users can edit the request before it moves to risk review.",
    rule: { and: [{ path: "workflow.state", op: "in", value: ["DRAFT", "INVESTMENT_REVIEW"] }, { path: "user.entitlements", op: "contains", value: "EDIT_INVESTMENT_REQUEST" }] },
  },
  ...levelCapabilities("Investment", "canEditInvestmentReview", "approvalRequirements.investmentLevels", "PENDING_INVESTMENT_APPROVAL", "APPROVE_INVESTMENT", investmentLevels),
  canEditRiskReview: {
    description: "Risk users can add review data during risk review.",
    rule: { and: [{ path: "workflow.state", op: "eq", value: "RISK_REVIEW" }, { path: "user.entitlements", op: "contains", value: "EDIT_RISK_REVIEW" }] },
  },
  ...levelCapabilities("Risk", "canEditRiskReview", "approvalRequirements.riskLevels", "PENDING_RISK_APPROVAL", "APPROVE_RISK", riskLevels),
  canWithdrawRequest: {
    description: "Entitled users can withdraw non-terminal cases.",
    rule: { and: [{ path: "user.entitlements", op: "contains", value: "WITHDRAW_REQUEST" }, { path: "workflow.state", op: "notIn", value: ["APPROVED", "DECLINED", "WITHDRAWN"] }] },
  },
  canDeclineRequest: {
    description: "Approval users can decline non-terminal cases during approval review.",
    rule: { and: [{ path: "user.entitlements", op: "contains", value: "DECLINE_REQUEST" }, { path: "workflow.state", op: "notIn", value: ["APPROVED", "DECLINED", "WITHDRAWN"] }] },
  },
} satisfies Record<string, NamedRuleDefinition>;
