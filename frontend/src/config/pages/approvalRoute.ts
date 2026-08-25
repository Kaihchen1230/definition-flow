import type { UiConfigNode } from "../uiDefinition";

export const approvalRoutePage = {
  id: "approvalRoute",
  label: "Approval Route",
  type: "page",
  children: [
    {
      id: "approvalRoutePanel",
      type: "calculation",
      component: "approvalRoutePanel",
      calculationId: "approvalRoute",
      actions: [{ id: "calculateApprovalRoute", type: "action", actionType: "calculation.approvalRoute", enabledRule: "canCalculateApprovalRoute" }],
    },
  ],
} satisfies UiConfigNode;
