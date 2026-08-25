import type { UiConfigNode } from "../uiDefinition";

export const finalReviewPage = {
  id: "finalReview",
  label: "Final Review",
  type: "page",
  visibleRule: "showFinalReview",
  children: [
    { id: "finalSummary", type: "summary", component: "finalReviewSummary", label: "Final Review Summary" },
    { id: "approveFinal", type: "action", actionType: "workflow.approveFinalRequest", enabledRule: "canApproveFinalRequest", label: "Approve Request" },
  ],
} satisfies UiConfigNode;
