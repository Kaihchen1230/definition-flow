import type { UiConfigNode } from "../uiDefinition";

export const finalReviewPage = {
  id: "finalReview",
  label: "Final Review",
  type: "page",
  visibleRule: "showFinalReview",
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    { id: "finalSummary", type: "summary", component: "finalReviewSummary", label: "Final Review Summary", visibleRule: null, enabledRule: null, required: false, requiredRule: null },
    { id: "approveFinal", type: "action", actionType: "workflow.approveFinalRequest", enabledRule: "canApproveFinalRequest", label: "Approve Request", visibleRule: null, required: false, requiredRule: null },
  ],
} satisfies UiConfigNode;
