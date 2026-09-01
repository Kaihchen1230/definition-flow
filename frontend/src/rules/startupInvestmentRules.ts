import type { DerivedFactDefinition, FrontendRuleDefinition, NamedRuleDefinition, RuleNode } from "./types";

const investmentLevels = ["LEVEL_1", "LEVEL_2", "LEVEL_3"] as const;
const riskLevels = ["LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"] as const;

export const startupInvestmentRules = {
  capabilities: {
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
  },
  uiRules: {
    showEnhancedRiskReview: {
      description: "Enhanced risk review is visible only to risk users on high-risk requests.",
      rule: { and: [{ path: "derived.investmentVariant", op: "eq", value: "HIGH_RISK" }, { path: "user.role", op: "eq", value: "RiskOfficer" }, { path: "workflow.state", op: "in", value: riskWorkflowStates() }] },
    },
    showFinalReview: {
      description: "Final review is visible near the final approval stage and after terminal decisions.",
      rule: { or: [{ path: "workflow.state", op: "in", value: [...pendingRiskApprovalStates(), "APPROVED", "DECLINED", "WITHDRAWN"] }, { path: "user.role", op: "eq", value: "Support" }] },
    },
    showRiskOfficerConfirmations: {
      description: "Page-level confirmations are visible only to risk users after routing to risk.",
      rule: { and: [{ path: "user.role", op: "eq", value: "RiskOfficer" }, { path: "workflow.state", op: "in", value: riskWorkflowStates() }] },
    },
    showRiskExceptions: {
      description: "Risk-authored exceptions appear only after a request is routed to risk.",
      rule: { and: [{ path: "user.role", op: "eq", value: "RiskOfficer" }, { path: "workflow.state", op: "in", value: riskWorkflowStates() }] },
    },
    showRiskApprovalRequirement: {
      description: "The risk approval selection appears once the request reaches risk review and remains visible afterwards.",
      rule: { path: "workflow.state", op: "in", value: riskWorkflowStates() },
    },
    showCompanyProfileRiskNote: {
      description: "Company Profile note appears when risk refers the page back.",
      rule: { path: "requestData.risk.pageConfirmations.companyProfile", op: "eq", value: "REFER_BACK" },
    },
    showInvestmentTermsRiskNote: {
      description: "Investment Terms note appears when risk refers the page back.",
      rule: { path: "requestData.risk.pageConfirmations.investmentTerms", op: "eq", value: "REFER_BACK" },
    },
    showFoundersOwnershipRiskNote: {
      description: "Founders & Ownership note appears when risk refers the page back.",
      rule: { path: "requestData.risk.pageConfirmations.foundersOwnership", op: "eq", value: "REFER_BACK" },
    },
  },
  actionRules: {},
  validationRules: {
    companyNameRequired: required("Company name is mandatory throughout approval.", "companyProfile", "companyName", "requestData.company.name", "Company name is required."),
    companyStageRequired: required("Company stage is mandatory throughout approval.", "companyProfile", "companyStage", "requestData.company.stage", "Company stage is required."),
    companySectorRequired: required("Company sector is mandatory throughout approval.", "companyProfile", "companySector", "requestData.company.sector", "Company sector is required."),
    companyFoundedDateRequired: required("Founded date is mandatory throughout approval.", "companyProfile", "companyFoundedDate", "requestData.company.foundedDate", "Founded date is required."),
    companyIncorporatedRequired: required("Incorporation status is mandatory throughout approval.", "companyProfile", "companyIncorporated", "requestData.company.incorporated", "Incorporation status is required."),
    investmentAmountRequired: required("Investment amount is mandatory throughout approval.", "investmentTerms", "investmentAmount", "requestData.investment.amount", "Investment amount is required."),
    investmentInstrumentRequired: required("Investment instrument is mandatory throughout approval.", "investmentTerms", "investmentInstrument", "requestData.investment.instrument", "Investment instrument is required."),
    investmentUseOfFundsRequired: required("Use of funds is mandatory throughout approval.", "investmentTerms", "useOfFunds", "requestData.investment.useOfFunds", "Use of funds is required."),
    foundersRequired: validation("A startup investment request needs at least one founder.", ["submit", "riskSubmit", "approve"], "foundersOwnership", "foundersTable", { path: "requestData.founders", op: "minCount", value: 1 }, "At least one founder is required."),
    founderDetailsRequired: validation("Every founder must have all mandatory details.", ["submit", "riskSubmit", "approve"], "foundersOwnership", "foundersTable", { allItems: { path: "requestData.founders", rule: { and: [{ path: "$item.name", op: "notEmpty" }, { path: "$item.title", op: "notEmpty" }, { path: "$item.ownershipPercent", op: "notEmpty" }, { path: "$item.backgroundCheck", op: "notEmpty" }] } } }, "Every founder requires a name, title, ownership percentage, and background-check completion status."),
    exceptionDetailsRequired: validation("Every exception must have a description and severity.", ["submit", "riskSubmit", "approve"], "riskExceptions", null, { allItems: { path: "requestData.exceptions", rule: { and: [{ path: "$item.description", op: "notEmpty" }, { path: "$item.severity", op: "notEmpty" }] } } }, "Every exception requires a description and severity."),
    investmentApprovalLevelRequired: validation("At least one investment approver level must be chosen manually.", ["submit", "riskSubmit", "approve"], "approvalRequirements", "investmentApprovalLevels", { path: "requestData.approvalRequirements.investmentLevels", op: "minCount", value: 1 }, "Select at least one required investment approver level."),
    riskApprovalLevelRequired: validation("At least one risk approver level must be chosen manually by the risk officer.", ["riskSubmit", "approve"], "approvalRequirements", "riskApprovalLevels", { path: "requestData.approvalRequirements.riskLevels", op: "minCount", value: 1 }, "Select at least one required risk approver level."),
    analystExceptionsNeedRiskConfirmation: validation("Risk must confirm analyst-created exceptions before leaving risk review.", ["riskSubmit", "approve"], "riskExceptions", "analystExceptions", { allItems: { path: "requestData.exceptions", where: { path: "$item.createdBy.role", op: "eq", value: "InvestmentAnalyst" }, rule: { path: "$item.riskConfirmation", op: "notEmpty" } } }, "Risk confirmation is required for each analyst-created exception."),
    companyProfileRiskConfirmed: confirmed("company profile", "companyProfile", "companyProfileRiskConfirmation", "companyProfile", "Company Profile"),
    investmentTermsRiskConfirmed: confirmed("investment terms", "investmentTerms", "investmentTermsRiskConfirmation", "investmentTerms", "Investment Terms"),
    foundersOwnershipRiskConfirmed: confirmed("founders and ownership", "foundersOwnership", "foundersOwnershipRiskConfirmation", "foundersOwnership", "Founders & Ownership"),
    companyProfileRiskNoteRequired: referBackNote("Company Profile", "companyProfile", "companyProfileRiskNote", "companyProfile"),
    investmentTermsRiskNoteRequired: referBackNote("Investment Terms", "investmentTerms", "investmentTermsRiskNote", "investmentTerms"),
    foundersOwnershipRiskNoteRequired: referBackNote("Founders & Ownership", "foundersOwnership", "foundersOwnershipRiskNote", "foundersOwnership"),
    enhancedRiskNarrativeRequired: validation("High-risk investments require an enhanced narrative authored on the risk page.", ["riskSubmit", "approve"], "enhancedRiskReview", "enhancedRiskNarrative", { or: [{ not: { rule: "showEnhancedRiskReview" } }, { path: "requestData.risk.enhancedReviewNarrative", op: "notEmpty" }] }, "Enhanced risk narrative is required for high-risk investments."),
    riskRecommendationRequired: validation("High-risk investments require a risk recommendation.", ["riskSubmit", "approve"], "enhancedRiskReview", "riskRecommendation", { or: [{ not: { rule: "showEnhancedRiskReview" } }, { path: "requestData.risk.recommendation", op: "notEmpty" }] }, "Risk recommendation is required for high-risk investments."),
    riskRecommendationMustSupportApproval: validation("Final approval is allowed only when risk recommends approval.", ["approve"], "enhancedRiskReview", "riskRecommendation", { or: [{ not: { rule: "showEnhancedRiskReview" } }, { path: "requestData.risk.recommendation", op: "eq", value: "APPROVE" }] }, "Risk must recommend approval before the final request can be approved."),
  },
} satisfies FrontendRuleDefinition;

export const startupInvestmentDerivedFacts: Record<string, DerivedFactDefinition> = {
  investmentVariant: {
    description: "Classifies the investment using current request data.",
    defaultValue: "STANDARD",
    cases: [{ value: "HIGH_RISK", when: { or: [{ path: "requestData.investment.amount", op: "gte", value: 5_000_000 }, { path: "requestData.company.stage", op: "in", value: ["SEED", "PRE_REVENUE"] }, { path: "requestData.risk.hasMaterialException", op: "eq", value: true }, { anyItem: { path: "requestData.exceptions", rule: { path: "$item.severity", op: "eq", value: "HIGH" } } }] } }],
  },
};

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

function levelCapabilities(area: "Investment" | "Risk", editorRule: string, path: string, statePrefix: string, entitlementPrefix: string, levels: readonly string[]) {
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
}

function levelWorkflowActionRules(area: "Investment" | "Risk", levels: readonly string[]) {
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
}

function containsLevel(path: string, level: string): RuleNode {
  return { path: `requestData.${path}`, op: "contains", value: level };
}

function excludesLevel(path: string, level: string): RuleNode {
  return { not: containsLevel(path, level) };
}

function pendingRiskApprovalStates() {
  return ["PENDING_RISK_APPROVAL_LEVEL_1", "PENDING_RISK_APPROVAL_LEVEL_2", "PENDING_RISK_APPROVAL_LEVEL_3", "PENDING_RISK_APPROVAL_LEVEL_4"];
}

function riskWorkflowStates() {
  return ["RISK_REVIEW", ...pendingRiskApprovalStates(), "APPROVED", "DECLINED"];
}

function required(description: string, pageId: string, nodeId: string, path: string, message: string) {
  return validation(description, ["submit", "riskSubmit", "approve"], pageId, nodeId, { path, op: "notEmpty" }, message);
}

function confirmed(description: string, pageId: string, nodeId: string, key: string, label: string) {
  return validation(`Risk must explicitly confirm the ${description} page.`, ["riskSubmit", "approve"], pageId, nodeId, { path: `requestData.risk.pageConfirmations.${key}`, op: "eq", value: "CONFIRMED" }, `Risk must confirm the ${label} page before the request can proceed.`);
}

function referBackNote(label: string, pageId: string, nodeId: string, key: string) {
  const visibilityRule = `show${key.charAt(0).toUpperCase()}${key.slice(1)}RiskNote`;
  return validation(`A refer-back decision on ${label} requires a note.`, ["riskSubmit", "approve"], pageId, nodeId, { or: [{ not: { rule: visibilityRule } }, { path: `requestData.risk.pageConfirmationNotes.${key}`, op: "notEmpty" }] }, `A refer-back note is required for ${label}.`);
}

function validation(description: string, scope: Array<"render" | "submit" | "riskSubmit" | "approve">, pageId: string, nodeId: string | null, rule: import("./types").RuleNode, message: string) {
  return { description, scope, severity: "blocking" as const, pageId, nodeId, rule, message };
}
