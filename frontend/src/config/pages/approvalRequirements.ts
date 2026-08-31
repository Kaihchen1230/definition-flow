import type { UiConfigNode } from "../uiDefinition";

export const approvalRequirementsPage = {
  id: "approvalRequirements",
  label: "Approval Requirements",
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    {
      id: "investmentApprovalRequirement",
      type: "section",
      label: "Investment Approval",
      visibleRule: null,
      enabledRule: null,
      required: false,
      requiredRule: null,
      children: [
        {
          id: "investmentApprovalLevels",
          type: "field",
          component: "checkboxGroup",
          dataPath: "approvalRequirements.investmentLevels",
          label: "Required investment approver levels",
          helperText: "Select every level that must approve. Approvals proceed from the lowest selected level to the highest.",
          visibleRule: null,
          enabledRule: "canEditInvestmentReview",
          required: true,
          requiredRule: null,
        },
      ],
    },
    {
      id: "riskApprovalRequirement",
      type: "section",
      label: "Risk Approval",
      visibleRule: "showRiskApprovalRequirement",
      enabledRule: null,
      required: false,
      requiredRule: null,
      children: [
        {
          id: "riskApprovalLevels",
          type: "field",
          component: "checkboxGroup",
          dataPath: "approvalRequirements.riskLevels",
          label: "Required risk approver levels",
          helperText: "Select every level that must approve. Approvals proceed from the lowest selected level to the highest.",
          visibleRule: null,
          enabledRule: "canEditRiskReview",
          required: true,
          requiredRule: null,
        },
      ],
    },
  ],
} satisfies UiConfigNode;
