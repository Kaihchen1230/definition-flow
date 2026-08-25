import { describe, expect, it } from "vitest";
import type { UiConfigNode } from "../config/uiDefinition";
import type { EvaluationContext } from "../types/api";
import { evaluateUiDefinition } from "./evaluateUiDefinition";

const context: EvaluationContext = {
  requestCaseId: "11111111-1111-1111-1111-111111111111",
  requestType: "startupInvestment",
  workflowState: "INVESTMENT_REVIEW",
  actor: { userId: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst", entitlements: ["EDIT_INVESTMENT_REQUEST"] },
  requestData: {
    company: { name: "Acme Robotics" },
  },
  derived: {},
  calculations: {},
  definitionVersions: {},
  canSave: true,
  ruleResults: {
    canEditInvestmentReview: { result: true, trace: [] },
    showRiskPage: { result: false, trace: [] },
  },
  workflowActions: [],
  validation: { render: [], submit: [], approve: [] },
};

describe("evaluateUiDefinition", () => {
  it("evaluates frontend-owned UI config with backend-provided rule results", () => {
    const pages: UiConfigNode[] = [
      {
        id: "companyProfile",
        type: "page",
        label: "Company Profile",
        enabledRule: "canEditInvestmentReview",
        children: [
          {
            id: "companyName",
            type: "field",
            component: "textInput",
            dataPath: "company.name",
            label: "Company Name",
          },
        ],
      },
      {
        id: "riskReview",
        type: "page",
        label: "Risk Review",
        visibleRule: "showRiskPage",
      },
    ];

    const evaluated = evaluateUiDefinition(pages, context);

    expect(evaluated[0].visible).toBe(true);
    expect(evaluated[0].enabled).toBe(true);
    expect(evaluated[0].children?.[0].value).toBe("Acme Robotics");
    expect(evaluated[1].visible).toBe(false);
    expect(evaluated[1].debug?.visibleRule).toEqual({ result: false, trace: [] });
  });
});
