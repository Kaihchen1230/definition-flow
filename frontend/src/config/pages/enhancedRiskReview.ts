import type { UiConfigNode } from "../uiDefinition";

export const enhancedRiskReviewPage = {
  id: "enhancedRiskReview",
  label: "Enhanced Risk Review",
  type: "page",
  visibleRule: "showEnhancedRiskReview",
  enabledRule: "canEditRiskReview",
  required: false,
  requiredRule: null,
  children: [
    { id: "enhancedRiskNarrative", type: "field", component: "textarea", dataPath: "risk.enhancedReviewNarrative", label: "Enhanced Risk Review Notes", visibleRule: null, enabledRule: null, required: false, requiredRule: "showEnhancedRiskReview" },
    { id: "riskRecommendation", type: "field", component: "radioGroup", dataPath: "risk.recommendation", label: "Risk Recommendation", visibleRule: null, enabledRule: null, required: false, requiredRule: "showEnhancedRiskReview" },
  ],
} satisfies UiConfigNode;
