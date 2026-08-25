import type { UiConfigNode } from "../uiDefinition";

export const riskExceptionsPage = {
  id: "riskExceptions",
  label: "Risk & Exceptions",
  type: "page",
  children: [
    {
      id: "analystExceptions",
      type: "collection",
      component: "exceptionList",
      dataPath: "exceptions",
      label: "Analyst Exceptions",
      filter: { path: "$item.createdBy.role", op: "eq", value: "InvestmentAnalyst" },
      actions: [{ id: "addAnalystException", type: "action", actionType: "collection.addItem", enabledRule: "canEditInvestmentReview" }],
    },
    {
      id: "riskExceptions",
      type: "collection",
      component: "exceptionList",
      dataPath: "exceptions",
      label: "Risk Exceptions",
      filter: { path: "$item.createdBy.role", op: "eq", value: "RiskOfficer" },
      actions: [{ id: "addRiskException", type: "action", actionType: "collection.addItem", enabledRule: "canEditRiskReview" }],
    },
  ],
} satisfies UiConfigNode;
