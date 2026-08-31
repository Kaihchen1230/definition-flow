import type { UiNode } from "../types/api";
import { uiComponentIds } from "../types/uiComponents";
import { startupInvestmentRules } from "../rules/startupInvestmentRules";
import { enumOptions } from "./enumOptions";
import { approvalRequirementsPage } from "./pages/approvalRequirements";
import { companyProfilePage } from "./pages/companyProfile";
import { enhancedRiskReviewPage } from "./pages/enhancedRiskReview";
import { finalReviewPage } from "./pages/finalReview";
import { foundersOwnershipPage } from "./pages/foundersOwnership";
import { investmentIndicatorsPage } from "./pages/investmentIndicators";
import { investmentTermsPage } from "./pages/investmentTerms";
import { riskExceptionsPage } from "./pages/riskExceptions";
import { startupInvestmentDataPaths } from "./startupInvestmentDataPaths";
import { validateUiDefinition } from "./validateUiDefinition";

export type UiConfigNode = Omit<UiNode, "visible" | "enabled" | "disabled" | "value" | "debug" | "children" | "actions"> & {
    children?: UiConfigNode[];
    actions?: UiConfigNode[];
  };

export type UiNavigationGroup = {
  id: string;
  label: string;
  pages: UiConfigNode[];
};

export type UiDefinition = {
  groups: UiNavigationGroup[];
};

export const startupInvestmentUiDefinition = {
  groups: [
    { id: "company", label: "Company", pages: [companyProfilePage, foundersOwnershipPage] },
    { id: "investment", label: "Investment", pages: [investmentTermsPage, investmentIndicatorsPage] },
    { id: "riskReview", label: "Risk Review", pages: [riskExceptionsPage, enhancedRiskReviewPage] },
    { id: "decision", label: "Decision", pages: [approvalRequirementsPage, finalReviewPage] },
  ],
} satisfies UiDefinition;

const ruleIds = new Set([
  ...Object.keys(startupInvestmentRules.capabilities),
  ...Object.keys(startupInvestmentRules.uiRules),
  ...Object.keys(startupInvestmentRules.actionRules),
  ...Object.keys(startupInvestmentRules.validationRules),
]);

export const startupInvestmentUiDefinitionErrors = validateUiDefinition(startupInvestmentUiDefinition.groups, {
  componentIds: new Set(uiComponentIds),
  dataPaths: startupInvestmentDataPaths,
  optionPaths: new Set(Object.keys(enumOptions)),
  ruleIds,
});

if (startupInvestmentUiDefinitionErrors.length > 0) {
  throw new Error(`Invalid startup investment UI definition:\n${startupInvestmentUiDefinitionErrors.join("\n")}`);
}
