import type { UiConfigNode } from "../uiDefinition";

export const companyProfilePage = {
  id: "companyProfile",
  label: "Company Profile",
  type: "page",
  visibleRule: null,
  enabledRule: null,
  required: false,
  requiredRule: null,
  children: [
    { id: "companyName", type: "field", component: "textInput", dataPath: "company.name", label: "Company Name", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "companyStage", type: "field", component: "dropdown", dataPath: "company.stage", label: "Stage", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "companySector", type: "field", component: "dropdown", dataPath: "company.sector", label: "Sector", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "companyFoundedDate", type: "field", component: "dateInput", dataPath: "company.foundedDate", label: "Founded Date", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    { id: "companyIncorporated", type: "field", component: "radioGroup", dataPath: "company.incorporated", label: "Incorporated", visibleRule: null, enabledRule: "canEditInvestmentReview", required: true, requiredRule: null },
    {
      id: "companyProfileRiskConfirmationSection",
      type: "section",
      label: "Risk Officer Confirmation",
      visibleRule: "showRiskOfficerConfirmations",
      enabledRule: "canEditRiskReview",
      required: false,
      requiredRule: null,
      children: [
        { id: "companyProfileRiskConfirmation", type: "field", component: "radioGroup", dataPath: "risk.pageConfirmations.companyProfile", label: "Company profile disposition", visibleRule: null, enabledRule: null, required: false, requiredRule: "canEditRiskReview" },
        { id: "companyProfileRiskNote", type: "field", component: "textarea", dataPath: "risk.pageConfirmationNotes.companyProfile", label: "Refer-back note", visibleRule: "requireCompanyProfileRiskNote", enabledRule: null, required: false, requiredRule: "requireCompanyProfileRiskNote" },
      ],
    },
  ],
} satisfies UiConfigNode;
