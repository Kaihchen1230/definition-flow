import type { UiConfigNode } from "../uiDefinition";

export const approvalRoutePage = {
  id: "approvalRoute",
  label: "Approval Route",
  type: "page",
  children: [
    {
      id: "enhancedRiskRouteGuidance",
      type: "section",
      label: "Enhanced Risk Inputs",
      visibleRule: "showEnhancedRiskReview",
      enabledRule: "canEditRiskReview",
      children: [
        { id: "approvalRouteRiskNarrative", type: "field", component: "textarea", dataPath: "risk.enhancedReviewNarrative", label: "Enhanced Risk Narrative" },
        { id: "approvalRouteRiskRecommendation", type: "field", component: "radioGroup", dataPath: "risk.recommendation", label: "Risk Recommendation" },
      ],
    },
    {
      id: "approvalRoutePanel",
      type: "calculation",
      component: "approvalRoutePanel",
      calculationId: "approvalRoute",
      actions: [{ id: "calculateApprovalRoute", type: "action", actionType: "calculation.approvalRoute", enabledRule: "canCalculateApprovalRoute" }],
    },
  ],
} satisfies UiConfigNode;
