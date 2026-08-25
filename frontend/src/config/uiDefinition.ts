import type { UiNode } from "../types/api";

export type UiConfigNode = Omit<UiNode, "visible" | "enabled" | "disabled" | "children" | "actions"> &
  Partial<Pick<UiNode, "visible" | "enabled" | "disabled">> & {
    children?: UiConfigNode[];
    actions?: UiConfigNode[];
  };

export type UiDefinition = {
  pages: UiConfigNode[];
};

export const startupInvestmentUiDefinition = {
  pages: [
    {
      id: "companyProfile",
      label: "Company Profile",
      type: "page",
      enabledRule: "canEditInvestmentReview",
      children: [
        { id: "companyName", type: "field", component: "textInput", dataPath: "company.name", label: "Company Name" },
        { id: "companyStage", type: "field", component: "dropdown", dataPath: "company.stage", label: "Stage" },
        { id: "companyFoundedDate", type: "field", component: "dateInput", dataPath: "company.foundedDate", label: "Founded Date" },
        { id: "companyIncorporated", type: "field", component: "radioGroup", dataPath: "company.incorporated", label: "Incorporated" },
      ],
    },
    {
      id: "investmentTerms",
      label: "Investment Terms",
      type: "page",
      enabledRule: "canEditInvestmentReview",
      children: [
        { id: "investmentAmount", type: "field", component: "currencyInput", dataPath: "investment.amount", label: "Investment Amount" },
        { id: "investmentInstrument", type: "field", component: "radioGroup", dataPath: "investment.instrument", label: "Instrument" },
        { id: "useOfFunds", type: "field", component: "textarea", dataPath: "investment.useOfFunds", label: "Use of Funds" },
      ],
    },
    {
      id: "foundersOwnership",
      label: "Founders & Ownership",
      type: "page",
      enabledRule: "canEditInvestmentReview",
      children: [
        {
          id: "foundersTable",
          type: "collection",
          component: "editableTable",
          dataPath: "founders",
          label: "Founders",
          requiredFields: ["name", "title", "ownershipPercent", "backgroundCheck"],
          actions: [{ id: "addFounder", type: "action", actionType: "collection.addItem", enabledRule: "canEditInvestmentReview" }],
        },
      ],
    },
    {
      id: "riskExceptions",
      label: "Risk & Exceptions",
      type: "page",
      children: [
        {
          id: "analystExceptions",
          type: "collection",
          component: "exceptionList",
          dataPath: "exceptions",
          label: "Analyst Exceptions",
          filter: { path: "$item.createdBy.role", op: "eq", value: "InvestmentAnalyst" },
          actions: [{ id: "addAnalystException", type: "action", actionType: "collection.addItem", enabledRule: "canEditInvestmentReview" }],
        },
        {
          id: "riskExceptions",
          type: "collection",
          component: "exceptionList",
          dataPath: "exceptions",
          label: "Risk Exceptions",
          filter: { path: "$item.createdBy.role", op: "eq", value: "RiskOfficer" },
          actions: [{ id: "addRiskException", type: "action", actionType: "collection.addItem", enabledRule: "canEditRiskReview" }],
        },
      ],
    },
    {
      id: "investmentIndicators",
      label: "Investment Indicators",
      type: "page",
      children: [{ id: "indicators", type: "field", component: "checkboxGroup", dataPath: "indicators", label: "Indicators" }],
    },
    {
      id: "enhancedRiskReview",
      label: "Enhanced Risk Review",
      type: "page",
      visibleRule: "showEnhancedRiskReview",
      enabledRule: "canEditRiskReview",
      children: [
        { id: "enhancedRiskNarrative", type: "field", component: "textarea", dataPath: "risk.enhancedReviewNarrative", label: "Enhanced Risk Narrative" },
        { id: "riskRecommendation", type: "field", component: "radioGroup", dataPath: "risk.recommendation", label: "Risk Recommendation" },
      ],
    },
    {
      id: "approvalRoute",
      label: "Approval Route",
      type: "page",
      children: [
        {
          id: "approvalRoutePanel",
          type: "calculation",
          component: "approvalRoutePanel",
          calculationId: "approvalRoute",
          actions: [{ id: "calculateApprovalRoute", type: "action", actionType: "calculation.approvalRoute", enabledRule: "canCalculateApprovalRoute" }],
        },
      ],
    },
    {
      id: "finalReview",
      label: "Final Review",
      type: "page",
      visibleRule: "showFinalReview",
      children: [
        { id: "finalSummary", type: "summary", component: "finalReviewSummary", label: "Final Review Summary" },
        { id: "approveFinal", type: "action", actionType: "workflow.approveFinalRequest", enabledRule: "canApproveFinalRequest", label: "Approve Request" },
      ],
    },
  ],
} satisfies UiDefinition;
