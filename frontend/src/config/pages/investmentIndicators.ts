import type { UiConfigNode } from "../uiDefinition";

export const investmentIndicatorsPage = {
  id: "investmentIndicators",
  label: "Investment Indicators",
  type: "page",
  children: [{ id: "indicators", type: "field", component: "checkboxGroup", dataPath: "indicators", label: "Indicators" }],
} satisfies UiConfigNode;
