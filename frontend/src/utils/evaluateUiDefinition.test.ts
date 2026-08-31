import { describe, expect, it } from "vitest";
import type { UiConfigNode } from "../config/uiDefinition";
import { startupInvestmentUiDefinition } from "../config/uiDefinition";
import type { EvaluationContext } from "../types/api";
import { evaluateUiDefinition } from "./evaluateUiDefinition";

const context: EvaluationContext = {
  requestCaseId: "11111111-1111-1111-1111-111111111111",
  requestType: "startupInvestment",
  workflowState: "INVESTMENT_REVIEW",
  user: { userId: "analyst", displayName: "Avery Analyst", role: "InvestmentAnalyst", entitlements: ["EDIT_INVESTMENT_REQUEST"] },
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
  validation: { render: [], submit: [], riskSubmit: [], approve: [] },
};

describe("evaluateUiDefinition", () => {
  it("uses the same explicit rule and required metadata on every config node", () => {
    const visit = (node: UiConfigNode) => {
      expect(Object.prototype.hasOwnProperty.call(node, "visibleRule")).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(node, "enabledRule")).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(node, "required")).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(node, "requiredRule")).toBe(true);
      node.children?.forEach(visit);
      node.actions?.forEach(visit);
    };

    startupInvestmentUiDefinition.pages.forEach(visit);
  });

  it("keeps investment fields read-only while requiring page confirmation from risk", () => {
    const pages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      workflowState: "RISK_REVIEW",
      ruleResults: {
        ...context.ruleResults,
        canEditInvestmentReview: { result: false, trace: [] },
        canEditRiskReview: { result: true, trace: [] },
        showRiskOfficerConfirmations: { result: true, trace: [] },
      },
    });
    const companyPage = pages.find((page) => page.id === "companyProfile")!;
    const companyName = companyPage.children?.find((node) => node.id === "companyName")!;
    const confirmationSection = companyPage.children?.find((node) => node.id === "companyProfileRiskConfirmationSection")!;
    const confirmation = confirmationSection.children?.[0]!;

    expect(companyName.disabled).toBe(true);
    expect(confirmationSection.visible).toBe(true);
    expect(confirmation.disabled).toBe(false);
    expect(confirmation.required).toBe(true);

    const referBackPages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      workflowState: "RISK_REVIEW",
      requestData: {
        ...context.requestData,
        risk: {
          pageConfirmations: { companyProfile: "REFER_BACK" },
          pageConfirmationNotes: { companyProfile: "" },
        },
      },
      ruleResults: {
        ...context.ruleResults,
        canEditInvestmentReview: { result: false, trace: [] },
        canEditRiskReview: { result: true, trace: [] },
        showRiskOfficerConfirmations: { result: true, trace: [] },
        showCompanyProfileRiskNote: { result: true, trace: [] },
      },
    });
    const referBackCompanyPage = referBackPages.find((page) => page.id === "companyProfile")!;
    const referBackSection = referBackCompanyPage.children?.find((node) => node.id === "companyProfileRiskConfirmationSection")!;
    const note = referBackSection.children?.find((node) => node.id === "companyProfileRiskNote")!;

    expect(note.visible).toBe(true);
    expect(note.required).toBe(true);
  });

  it("keeps visible risk confirmations required during final approval", () => {
    const pages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      workflowState: "PENDING_RISK_APPROVAL",
      user: { ...context.user, role: "RiskOfficer", entitlements: ["APPROVE_FINAL_REQUEST"] },
      ruleResults: {
        ...context.ruleResults,
        canEditInvestmentReview: { result: false, trace: [] },
        canEditRiskReview: { result: false, trace: [] },
        showRiskOfficerConfirmations: { result: true, trace: [] },
      },
    });
    const companyPage = pages.find((page) => page.id === "companyProfile")!;
    const confirmationSection = companyPage.children?.find((node) => node.id === "companyProfileRiskConfirmationSection")!;
    const confirmation = confirmationSection.children?.find((node) => node.id === "companyProfileRiskConfirmation")!;

    expect(confirmation.visible).toBe(true);
    expect(confirmation.disabled).toBe(true);
    expect(confirmation.required).toBe(true);
  });

  it("requires analyst exception confirmation only when risk confirmation rules apply", () => {
    const analystPages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, context);
    const riskPages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      ruleResults: { ...context.ruleResults, showRiskOfficerConfirmations: { result: true, trace: [] } },
    });

    const analystExceptions = analystPages.find((page) => page.id === "riskExceptions")?.children?.find((node) => node.id === "analystExceptions");
    const riskExceptions = riskPages.find((page) => page.id === "riskExceptions")?.children?.find((node) => node.id === "analystExceptions");

    expect(analystExceptions?.requiredFields).toEqual(["description", "severity"]);
    expect(riskExceptions?.requiredFields).toEqual(["description", "severity", "riskConfirmation"]);
  });

  it("hides risk-only pages and collections from the investment analyst", () => {
    const analystPages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      ruleResults: {
        ...context.ruleResults,
        showEnhancedRiskReview: { result: false, trace: [] },
        showRiskExceptions: { result: false, trace: [] },
      },
    });
    const riskPages = evaluateUiDefinition(startupInvestmentUiDefinition.pages, {
      ...context,
      user: { ...context.user, role: "RiskOfficer" },
      ruleResults: {
        ...context.ruleResults,
        showEnhancedRiskReview: { result: true, trace: [] },
        showRiskExceptions: { result: true, trace: [] },
      },
    });

    expect(analystPages.find((page) => page.id === "enhancedRiskReview")?.visible).toBe(false);
    expect(analystPages.find((page) => page.id === "riskExceptions")?.children?.find((node) => node.id === "riskOfficerExceptions")?.visible).toBe(false);
    expect(riskPages.find((page) => page.id === "enhancedRiskReview")?.visible).toBe(true);
    expect(riskPages.find((page) => page.id === "riskExceptions")?.children?.find((node) => node.id === "riskOfficerExceptions")?.visible).toBe(true);
  });

  it("evaluates frontend-owned UI config with backend-provided rule results", () => {
    const pages: UiConfigNode[] = [
      {
        id: "companyProfile",
        type: "page",
        label: "Company Profile",
        visibleRule: null,
        enabledRule: "canEditInvestmentReview",
        required: false,
        requiredRule: null,
        children: [
          {
            id: "companyName",
            type: "field",
            component: "textInput",
            dataPath: "company.name",
            label: "Company Name",
            visibleRule: null,
            enabledRule: null,
            required: true,
            requiredRule: null,
          },
        ],
      },
      {
        id: "riskReview",
        type: "page",
        label: "Risk Review",
        visibleRule: "showRiskPage",
        enabledRule: null,
        required: false,
        requiredRule: null,
      },
    ];

    const evaluated = evaluateUiDefinition(pages, context);

    expect(evaluated[0].visible).toBe(true);
    expect(evaluated[0].enabled).toBe(true);
    expect(evaluated[0].children?.[0].value).toBe("Acme Robotics");
    expect(evaluated[0].children?.[0].required).toBe(true);
    expect(evaluated[1].visible).toBe(false);
    expect(evaluated[1].debug?.visibleRule).toEqual({ result: false, trace: [] });
  });

  it("applies visibility rules to nested sections", () => {
    const pages: UiConfigNode[] = [
      {
        id: "approvalRoute",
        type: "page",
        label: "Approval Route",
        visibleRule: null,
        enabledRule: null,
        required: false,
        requiredRule: null,
        children: [
          {
            id: "enhancedRiskRouteGuidance",
            type: "section",
            label: "Enhanced Risk Inputs",
            visibleRule: "showRiskPage",
            enabledRule: null,
            required: false,
            requiredRule: null,
            children: [
              {
                id: "riskRecommendation",
                type: "field",
                component: "radioGroup",
                dataPath: "risk.recommendation",
                label: "Risk Recommendation",
                visibleRule: null,
                enabledRule: null,
                required: true,
                requiredRule: "showRiskPage",
              },
            ],
          },
        ],
      },
    ];

    const hidden = evaluateUiDefinition(pages, context);
    const visible = evaluateUiDefinition(pages, {
      ...context,
      ruleResults: { ...context.ruleResults, showRiskPage: { result: true, trace: [] } },
    });

    expect(hidden[0].children?.[0].visible).toBe(false);
    expect(hidden[0].children?.[0].children?.[0].visible).toBe(false);
    expect(visible[0].children?.[0].visible).toBe(true);
    expect(visible[0].children?.[0].children?.[0].visible).toBe(true);
    expect(visible[0].children?.[0].children?.[0].required).toBe(true);
  });
});
