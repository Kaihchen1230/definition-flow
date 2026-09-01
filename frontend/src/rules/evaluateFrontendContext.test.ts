import { describe, expect, it } from "vitest";
import type { RawEvaluationContext } from "../types/api";
import { evaluateFrontendContext } from "./evaluateFrontendContext";

const raw = (role = "RiskOfficer"): RawEvaluationContext => ({
  requestCaseId: "case-1",
  requestType: "startupInvestment",
  workflowState: "RISK_REVIEW",
  user: { userId: "risk-officer", displayName: "Riley Risk", role, entitlements: role === "RiskOfficer" ? ["EDIT_RISK_REVIEW"] : ["EDIT_INVESTMENT_REQUEST"] },
  requestData: {
    company: { name: "Acme", stage: "SEED", sector: "AI", foundedDate: "2024-01-01", incorporated: "YES" },
    investment: { amount: 6_000_000, instrument: "SAFE", useOfFunds: "Growth" },
    approvalRequirements: { investmentLevels: ["LEVEL_1", "LEVEL_3"], riskLevels: ["LEVEL_2", "LEVEL_4"] },
    founders: [{ name: "A", title: "CEO", ownershipPercent: 50, backgroundCheck: "YES" }],
    exceptions: [],
    risk: { hasMaterialException: false, enhancedReviewNarrative: "Reviewed", recommendation: "APPROVE", pageConfirmations: { companyProfile: "CONFIRMED", investmentTerms: "CONFIRMED", foundersOwnership: "CONFIRMED" }, pageConfirmationNotes: { companyProfile: "", investmentTerms: "", foundersOwnership: "" } },
  },
  calculations: {},
  definitionVersions: {},
  workflowActions: [
    { id: "workflow.submitRiskReviewLevel1", label: "Submit to Risk Level 1" },
    { id: "workflow.submitRiskReviewLevel2", label: "Submit to Risk Level 2" },
    { id: "workflow.submitRiskReviewLevel3", label: "Submit to Risk Level 3" },
    { id: "workflow.submitRiskReviewLevel4", label: "Submit to Risk Level 4" },
  ],
});

describe("evaluateFrontendContext", () => {
  it("derives the variant and evaluates permissions and workflow actions", () => {
    const result = evaluateFrontendContext(raw());
    expect(result.derived.investmentVariant).toBe("HIGH_RISK");
    expect(result.canSave).toBe(true);
    expect(result.workflowActions.filter((action) => action.visible).map((action) => action.id)).toEqual(["workflow.submitRiskReviewLevel2"]);
  });

  it("routes an approver to the next selected tier and skips unselected tiers", () => {
    const pending = raw();
    pending.workflowState = "PENDING_RISK_APPROVAL_LEVEL_2";
    pending.user = { userId: "risk-approver-l2", displayName: "Rina Risk", role: "RiskOfficer", entitlements: ["APPROVE_RISK_LEVEL_2"] };
    pending.workflowActions = [
      { id: "workflow.approveRiskLevel2Complete", label: "Approve as Risk Level 2" },
      { id: "workflow.approveRiskLevel2ToLevel3", label: "Continue to Risk Level 3" },
      { id: "workflow.approveRiskLevel2ToLevel4", label: "Continue to Risk Level 4" },
    ];

    expect(evaluateFrontendContext(pending).workflowActions.filter((action) => action.visible).map((action) => action.id)).toEqual(["workflow.approveRiskLevel2ToLevel4"]);

    pending.user.entitlements = ["APPROVE_RISK_LEVEL_3"];
    expect(evaluateFrontendContext(pending).workflowActions.some((action) => action.visible)).toBe(false);
  });

  it("fails closed when a legacy submit action is not mapped to a level entitlement rule", () => {
    const pending = raw("InvestmentAnalyst");
    pending.workflowState = "INVESTMENT_REVIEW";
    pending.user = {
      userId: "analyst",
      displayName: "Avery Analyst",
      role: "InvestmentAnalyst",
      entitlements: ["EDIT_INVESTMENT_REQUEST"],
    };
    pending.requestData.approvalRequirements.investmentLevels = ["LEVEL_1", "LEVEL_3"];
    pending.workflowActions = [
      { id: "workflow.submitInvestmentReview", label: "workflow.submitInvestmentReview" },
    ];

    const action = evaluateFrontendContext(pending).workflowActions[0];

    expect(action.visible).toBe(false);
    expect(action.enabled).toBe(false);
    expect(action.label).toBe("Submit for investment approval");
  });

  it("lets an analyst submit to the first selected queue but not approve it onward", () => {
    const pending = raw("InvestmentAnalyst");
    pending.workflowState = "INVESTMENT_REVIEW";
    pending.user = {
      userId: "analyst",
      displayName: "Avery Analyst",
      role: "InvestmentAnalyst",
      entitlements: ["EDIT_INVESTMENT_REQUEST"],
    };
    pending.requestData.approvalRequirements.investmentLevels = ["LEVEL_1", "LEVEL_3"];
    pending.workflowActions = [
      { id: "workflow.submitInvestmentReviewLevel1", label: "workflow.submitInvestmentReviewLevel1" },
      { id: "workflow.submitInvestmentReviewLevel2", label: "workflow.submitInvestmentReviewLevel2" },
      { id: "workflow.submitInvestmentReviewLevel3", label: "workflow.submitInvestmentReviewLevel3" },
    ];

    const submitted = evaluateFrontendContext(pending);
    expect(submitted.workflowActions.filter((action) => action.visible).map((action) => action.label)).toEqual(["Submit to Investment Level 1"]);

    pending.workflowState = "PENDING_INVESTMENT_APPROVAL_LEVEL_1";
    pending.workflowActions = [
      { id: "workflow.approveInvestmentLevel1ToLevel3", label: "workflow.approveInvestmentLevel1ToLevel3" },
    ];

    const approval = evaluateFrontendContext(pending).workflowActions[0];
    expect(approval.visible).toBe(false);
    expect(approval.enabled).toBe(false);
    expect(approval.label).toBe("Approve Investment Level 1 and continue to Level 3");
  });

  it("requires a note immediately when risk selects Refer back", () => {
    const data = raw();
    data.requestData.risk.pageConfirmations.companyProfile = "REFER_BACK";
    const result = evaluateFrontendContext(data);
    expect(result.ruleResults.companyProfileRiskNoteRequired.result).toBe(false);
    expect(result.validation.riskSubmit.map((issue) => issue.ruleId)).toContain("companyProfileRiskNoteRequired");

    data.requestData.risk.pageConfirmationNotes.companyProfile = "Company details need clarification.";
    expect(evaluateFrontendContext(data).ruleResults.companyProfileRiskNoteRequired.result).toBe(true);
  });

  it("requires an exact industry description only when Other is selected", () => {
    const data = raw("InvestmentAnalyst");
    data.workflowState = "INVESTMENT_REVIEW";
    data.requestData.company.sector = "OTHER";

    const missingDescription = evaluateFrontendContext(data);
    expect(missingDescription.ruleResults.showOtherCompanySector.result).toBe(true);
    expect(missingDescription.ruleResults.companySectorOtherRequired.result).toBe(false);
    expect(missingDescription.validation.submit.map((issue) => issue.ruleId)).toContain("companySectorOtherRequired");

    data.requestData.company.sectorOther = "Space logistics";
    expect(evaluateFrontendContext(data).ruleResults.companySectorOtherRequired.result).toBe(true);

    data.requestData.company.sector = "AI";
    const standardSector = evaluateFrontendContext(data);
    expect(standardSector.ruleResults.showOtherCompanySector.result).toBe(false);
    expect(standardSector.ruleResults.companySectorOtherRequired.result).toBe(true);
  });

  it("keeps risk-only rules unavailable to an investment analyst", () => {
    const result = evaluateFrontendContext(raw("InvestmentAnalyst"));
    expect(result.ruleResults.showRiskOfficerConfirmations.result).toBe(false);
    expect(result.ruleResults.showRiskExceptions.result).toBe(false);
    expect(result.canSave).toBe(false);
  });

  it("evaluates a new draft whose request data is completely empty", () => {
    const emptyDraft: RawEvaluationContext = {
      ...raw("InvestmentAnalyst"),
      workflowState: "DRAFT",
      requestData: {},
      calculations: {},
      workflowActions: [{ id: "workflow.startInvestmentReview", label: "Start investment review" }],
    };

    const result = evaluateFrontendContext(emptyDraft);

    expect(result.requestData).toEqual({});
    expect(result.canSave).toBe(true);
    expect(result.derived.investmentVariant).toBe("STANDARD");
    expect(result.workflowActions[0].enabled).toBe(true);
    expect(result.validation.submit.map((issue) => issue.ruleId)).toContain("companyNameRequired");
    expect(result.validation.submit.map((issue) => issue.ruleId)).toContain("investmentApprovalLevelRequired");
  });

  it("classifies a request with a high-severity exception as high risk", () => {
    const data = raw();
    data.requestData.company.stage = "GROWTH";
    data.requestData.investment.amount = 1_000_000;
    data.requestData.risk.hasMaterialException = false;
    data.requestData.exceptions = [{
      id: "ex-1",
      description: "Material policy exception",
      severity: "HIGH",
      createdBy: { userId: "analyst", role: "InvestmentAnalyst" },
    }];

    expect(evaluateFrontendContext(data).derived.investmentVariant).toBe("HIGH_RISK");
  });
});
