import type { RuleNode, ValidationRuleDefinition, ValidationScope } from "../types";

const validation = (description: string, scope: ValidationScope[], pageId: string, nodeId: string | null, rule: RuleNode, message: string): ValidationRuleDefinition => ({
  description,
  scope,
  severity: "blocking",
  pageId,
  nodeId,
  rule,
  message,
});

const required = (description: string, pageId: string, nodeId: string, path: string, message: string) => (
  validation(description, ["submit", "riskSubmit", "approve"], pageId, nodeId, { path, op: "notEmpty" }, message)
);

const confirmed = (description: string, pageId: string, nodeId: string, key: string, label: string) => (
  validation(`Risk must explicitly confirm the ${description} page.`, ["riskSubmit", "approve"], pageId, nodeId, { path: `requestData.risk.pageConfirmations.${key}`, op: "eq", value: "CONFIRMED" }, `Risk must confirm the ${label} page before the request can proceed.`)
);

const referBackNote = (label: string, pageId: string, nodeId: string, key: string) => {
  const visibilityRule = `show${key.charAt(0).toUpperCase()}${key.slice(1)}RiskNote`;
  return validation(`A refer-back decision on ${label} requires a note.`, ["riskSubmit", "approve"], pageId, nodeId, { or: [{ not: { rule: visibilityRule } }, { path: `requestData.risk.pageConfirmationNotes.${key}`, op: "notEmpty" }] }, `A refer-back note is required for ${label}.`);
};

/**
 * Defines user-facing validation issues, their workflow scopes, and their UI
 * targets. These rules may reuse capability and UI rule IDs as predicates.
 */
export const startupInvestmentValidationRules = {
  companyNameRequired: required("Company name is mandatory throughout approval.", "companyProfile", "companyName", "requestData.company.name", "Company name is required."),
  companyStageRequired: required("Company stage is mandatory throughout approval.", "companyProfile", "companyStage", "requestData.company.stage", "Company stage is required."),
  companySectorRequired: required("Company sector is mandatory throughout approval.", "companyProfile", "companySector", "requestData.company.sector", "Company sector is required."),
  companySectorOtherRequired: validation("Other sectors require an exact industry description.", ["submit", "riskSubmit", "approve"], "companyProfile", "companySectorOther", { or: [{ not: { rule: "showOtherCompanySector" } }, { path: "requestData.company.sectorOther", op: "notEmpty" }] }, "Specify the industry sector when Other is selected."),
  companyFoundedDateRequired: required("Founded date is mandatory throughout approval.", "companyProfile", "companyFoundedDate", "requestData.company.foundedDate", "Founded date is required."),
  companyIncorporatedRequired: required("Incorporation status is mandatory throughout approval.", "companyProfile", "companyIncorporated", "requestData.company.incorporated", "Incorporation status is required."),
  investmentAmountRequired: required("Investment amount is mandatory throughout approval.", "investmentTerms", "investmentAmount", "requestData.investment.amount", "Investment amount is required."),
  investmentInstrumentRequired: required("Investment instrument is mandatory throughout approval.", "investmentTerms", "investmentInstrument", "requestData.investment.instrument", "Investment instrument is required."),
  investmentUseOfFundsRequired: required("Use of funds is mandatory throughout approval.", "investmentTerms", "useOfFunds", "requestData.investment.useOfFunds", "Use of funds is required."),
  // DEMO: comment out investmentUseOfFundsRequired above and uncomment this
  // rule so only large investments are blocked when use of funds is empty.
  // useOfFundsRequiredForLargeInvestment: validation(
  //   "Large investments require a planned use of funds.",
  //   ["submit", "riskSubmit", "approve"],
  //   "investmentTerms",
  //   "useOfFunds",
  //   {
  //     or: [
  //       { not: { rule: "requireUseOfFundsForLargeInvestment" } },
  //       { path: "requestData.investment.useOfFunds", op: "notEmpty" },
  //     ],
  //   },
  //   "Describe the planned use of funds for investments of $5 million or more.",
  // ),
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
} satisfies Record<string, ValidationRuleDefinition>;
