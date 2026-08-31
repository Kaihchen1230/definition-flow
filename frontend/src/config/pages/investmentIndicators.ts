import type { UiConfigNode } from "../uiDefinition";

export const investmentIndicatorsPage = {
  id: "investmentIndicators",
  label: "Risk Indicators",
  type: "page",
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: false,
  requiredRule: null,
  children: [
    { id: "indicators", type: "field", component: "checkboxGroup", dataPath: "indicators", label: "Applicable Risk Indicators", helperText: "Select every indicator that applies. Leave all options clear if none apply.", visibleRule: null, enabledRule: null, required: false, requiredRule: null },
  ],
} satisfies UiConfigNode;
