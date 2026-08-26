import type { UiConfigNode } from "../uiDefinition";

export const investmentIndicatorsPage = {
  id: "investmentIndicators",
  label: "Investment Indicators",
  type: "page",
  visibleRule: null,
  enabledRule: "canEditInvestmentReview",
  required: false,
  requiredRule: null,
  children: [
    { id: "indicators", type: "field", component: "checkboxGroup", dataPath: "indicators", label: "Indicators", visibleRule: null, enabledRule: null, required: false, requiredRule: null },
  ],
} satisfies UiConfigNode;
