import type { UiConfigNode } from "../uiDefinition";

export const enhancedRiskReviewPage = {
  id: "enhancedRiskReview",
  label: "Enhanced Risk Review",
  type: "page",
  visibleRule: "showEnhancedRiskReview",
  enabledRule: "canEditRiskReview",
  children: [
    { id: "enhancedRiskNarrative", type: "field", component: "textarea", dataPath: "risk.enhancedReviewNarrative", label: "Enhanced Risk Narrative" },
    { id: "riskRecommendation", type: "field", component: "radioGroup", dataPath: "risk.recommendation", label: "Risk Recommendation" },
  ],
} satisfies UiConfigNode;
