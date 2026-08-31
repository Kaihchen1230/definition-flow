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

export type UiDefinition = {
  pages: UiConfigNode[];
};

export const startupInvestmentUiDefinition = {
  pages: [
    companyProfilePage,
    investmentTermsPage,
    foundersOwnershipPage,
    riskExceptionsPage,
    investmentIndicatorsPage,
    enhancedRiskReviewPage,
    approvalRequirementsPage,
    finalReviewPage,
  ],
} satisfies UiDefinition;

const ruleIds = new Set([
  ...Object.keys(startupInvestmentRules.capabilities),
  ...Object.keys(startupInvestmentRules.uiRules),
  ...Object.keys(startupInvestmentRules.actionRules),
  ...Object.keys(startupInvestmentRules.validationRules),
]);

export const startupInvestmentUiDefinitionErrors = validateUiDefinition(startupInvestmentUiDefinition.pages, {
  componentIds: new Set(uiComponentIds),
  dataPaths: startupInvestmentDataPaths,
  optionPaths: new Set(Object.keys(enumOptions)),
  ruleIds,
});

if (startupInvestmentUiDefinitionErrors.length > 0) {
  throw new Error(`Invalid startup investment UI definition:\n${startupInvestmentUiDefinitionErrors.join("\n")}`);
}
