import type { UiConfigNode } from "../uiDefinition";

export const foundersOwnershipPage = {
  id: "foundersOwnership",
  label: "Founders & Ownership",
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    {
      id: "foundersTable",
      type: "collection",
      component: "editableTable",
      dataPath: "founders",
      label: "Founders",
      visibleRule: null,
      enabledRule: "canEditInvestmentReview",
      required: true,
      requiredRule: null,
      requiredFields: ["name", "title", "ownershipPercent", "backgroundCheck"],
      actions: [{ id: "addFounder", type: "action", actionType: "collection.addItem", visibleRule: null, enabledRule: "canEditInvestmentReview", required: false, requiredRule: null }],
    },
    {
      id: "foundersOwnershipRiskConfirmationSection",
      type: "section",
      label: "Risk Officer Confirmation",
      visibleRule: "showRiskOfficerConfirmations",
      enabledRule: "canEditRiskReview",
      required: false,
      requiredRule: null,
      children: [
        { id: "foundersOwnershipRiskConfirmation", type: "field", component: "radioGroup", dataPath: "risk.pageConfirmations.foundersOwnership", label: "Founders and ownership disposition", visibleRule: null, enabledRule: null, required: false, requiredRule: "canEditRiskReview" },
        { id: "foundersOwnershipRiskNote", type: "field", component: "textarea", dataPath: "risk.pageConfirmationNotes.foundersOwnership", label: "Refer-back note", visibleRule: "requireFoundersOwnershipRiskNote", enabledRule: null, required: false, requiredRule: "requireFoundersOwnershipRiskNote" },
      ],
    },
  ],
} satisfies UiConfigNode;
