import type { UiConfigNode } from "../uiDefinition";

export const investmentTermsPage = {
  id: "investmentTerms",
  label: "Investment Terms",
  type: "page",
  enabledRule: "canEditInvestmentReview",
  children: [
    { id: "investmentAmount", type: "field", component: "currencyInput", dataPath: "investment.amount", label: "Investment Amount" },
    { id: "investmentInstrument", type: "field", component: "radioGroup", dataPath: "investment.instrument", label: "Instrument" },
    { id: "useOfFunds", type: "field", component: "textarea", dataPath: "investment.useOfFunds", label: "Use of Funds" },
  ],
} satisfies UiConfigNode;
