import type { UiConfigNode } from "../uiDefinition";

export const approvalRoutePage = {
  id: "approvalRoute",
  label: "Approval Route",
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    {
      id: "enhancedRiskRouteGuidance",
      type: "section",
      label: "Enhanced Risk Inputs",
      visibleRule: "showEnhancedRiskReview",
      enabledRule: "canEditRiskReview",
      required: false,
      requiredRule: null,
      children: [
        { id: "approvalRouteRiskNarrative", type: "field", component: "textarea", dataPath: "risk.enhancedReviewNarrative", label: "Enhanced Risk Narrative", visibleRule: null, enabledRule: null, required: false, requiredRule: "canEditRiskReview" },
        { id: "approvalRouteRiskRecommendation", type: "field", component: "radioGroup", dataPath: "risk.recommendation", label: "Risk Recommendation", visibleRule: null, enabledRule: null, required: false, requiredRule: "canEditRiskReview" },
      ],
    },
    {
      id: "approvalRoutePanel",
      type: "calculation",
      component: "approvalRoutePanel",
      calculationId: "approvalRoute",
      visibleRule: null,
      enabledRule: null,
      required: false,
      requiredRule: null,
      actions: [{ id: "calculateApprovalRoute", type: "action", actionType: "calculation.approvalRoute", visibleRule: null, enabledRule: "canCalculateApprovalRoute", required: false, requiredRule: null }],
    },
  ],
} satisfies UiConfigNode;
