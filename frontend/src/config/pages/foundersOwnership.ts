import type { UiConfigNode } from "../uiDefinition";

export const foundersOwnershipPage = {
  id: "foundersOwnership",
  label: "Founders & Ownership",
  type: "page",
  enabledRule: "canEditInvestmentReview",
  children: [
    {
      id: "foundersTable",
      type: "collection",
      component: "editableTable",
      dataPath: "founders",
      label: "Founders",
      requiredFields: ["name", "title", "ownershipPercent", "backgroundCheck"],
      actions: [{ id: "addFounder", type: "action", actionType: "collection.addItem", enabledRule: "canEditInvestmentReview" }],
    },
  ],
} satisfies UiConfigNode;
