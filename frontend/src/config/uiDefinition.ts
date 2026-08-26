import type { UiNode } from "../types/api";
import { approvalRoutePage } from "./pages/approvalRoute";
import { companyProfilePage } from "./pages/companyProfile";
import { enhancedRiskReviewPage } from "./pages/enhancedRiskReview";
import { finalReviewPage } from "./pages/finalReview";
import { foundersOwnershipPage } from "./pages/foundersOwnership";
import { investmentIndicatorsPage } from "./pages/investmentIndicators";
import { investmentTermsPage } from "./pages/investmentTerms";
import { riskExceptionsPage } from "./pages/riskExceptions";

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
    approvalRoutePage,
    finalReviewPage,
  ],
} satisfies UiDefinition;
