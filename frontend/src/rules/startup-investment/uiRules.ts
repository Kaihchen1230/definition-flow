import type { NamedRuleDefinition } from "../types";
import { pendingRiskApprovalStates, riskWorkflowStates } from "./workflowStates";

/**
 * Defines presentation conditions used by visibleRule and requiredRule in the
 * startup-investment UI configuration. These rules describe UI state, not user authority.
 */
export const startupInvestmentUiRules = {
  // DEMO: uncomment to make the Risk Indicators page conditional.
  // showRiskIndicators: {
  //   description: "Risk indicators apply to early-stage companies.",
  //   rule: { path: "requestData.company.stage", op: "in", value: ["SEED", "PRE_REVENUE"] },
  // },
  // DEMO: uncomment with isLargeInvestment in derivedFacts.ts to drive the
  // Planned Use of Funds required marker from a reusable business fact.
  // requireUseOfFundsForLargeInvestment: {
  //   description: "Large investments require a planned use of funds.",
  //   rule: { path: "derived.isLargeInvestment", op: "eq", value: true },
  // },
  showOtherCompanySector: {
    description: "The exact industry sector is needed when Other is selected.",
    rule: { path: "requestData.company.sector", op: "eq", value: "OTHER" },
  },
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
} satisfies Record<string, NamedRuleDefinition>;
