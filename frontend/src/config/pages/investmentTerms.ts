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
    { id: "investmentAmount", type: "field", component: "currencyInput", dataPath: "investment.amount", label: "Proposed Investment Amount", constraints: { min: 1, step: 1 }, visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "investmentInstrument", type: "field", component: "radioGroup", dataPath: "investment.instrument", label: "Investment Instrument", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "useOfFunds", type: "field", component: "textarea", dataPath: "investment.useOfFunds", label: "Planned Use of Funds", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    {
      id: "investmentTermsRiskConfirmationSection",
      type: "section",
      label: "Risk Officer Confirmation",
      visibleRule: "showRiskOfficerConfirmations",
      enabledRule: "canEditRiskReview",
      required: false,
      requiredRule: null,
      children: [
        { id: "investmentTermsRiskConfirmation", type: "field", component: "radioGroup", dataPath: "risk.pageConfirmations.investmentTerms", label: "Investment terms review decision", visibleRule: null, enabledRule: null, required: false, requiredRule: "showRiskOfficerConfirmations" },
        { id: "investmentTermsRiskNote", type: "field", component: "textarea", dataPath: "risk.pageConfirmationNotes.investmentTerms", label: "Reason for referring the investment terms back", visibleRule: "showInvestmentTermsRiskNote", enabledRule: null, required: false, requiredRule: "showInvestmentTermsRiskNote" },
      ],
    },
  ],
} satisfies UiConfigNode;
