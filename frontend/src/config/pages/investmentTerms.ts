import type { UiConfigNode } from "../uiDefinition";

export const investmentTermsPage = {
  id: "investmentTerms",
  label: "Investment Terms",
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    { id: "investmentAmount", type: "field", component: "currencyInput", dataPath: "investment.amount", label: "Investment Amount", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "investmentInstrument", type: "field", component: "radioGroup", dataPath: "investment.instrument", label: "Instrument", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "useOfFunds", type: "field", component: "textarea", dataPath: "investment.useOfFunds", label: "Use of Funds", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    {
      id: "investmentTermsRiskConfirmationSection",
      type: "section",
      label: "Risk Officer Confirmation",
      visibleRule: "showRiskOfficerConfirmations",
      enabledRule: "canEditRiskReview",
      required: false,
      requiredRule: null,
      children: [
        { id: "investmentTermsRiskConfirmation", type: "field", component: "radioGroup", dataPath: "risk.pageConfirmations.investmentTerms", label: "Investment terms disposition", visibleRule: null, enabledRule: null, required: false, requiredRule: "canEditRiskReview" },
        { id: "investmentTermsRiskNote", type: "field", component: "textarea", dataPath: "risk.pageConfirmationNotes.investmentTerms", label: "Refer-back note", visibleRule: "requireInvestmentTermsRiskNote", enabledRule: null, required: false, requiredRule: "requireInvestmentTermsRiskNote" },
      ],
    },
  ],
} satisfies UiConfigNode;
