import type { UiConfigNode } from "../uiDefinition";

export const companyProfilePage = {
  id: "companyProfile",
  label: "Company Profile",
  type: "page",
  enabledRule: "canEditInvestmentReview",
  children: [
    { id: "companyName", type: "field", component: "textInput", dataPath: "company.name", label: "Company Name" },
    { id: "companyStage", type: "field", component: "dropdown", dataPath: "company.stage", label: "Stage" },
    { id: "companyFoundedDate", type: "field", component: "dateInput", dataPath: "company.foundedDate", label: "Founded Date" },
    { id: "companyIncorporated", type: "field", component: "radioGroup", dataPath: "company.incorporated", label: "Incorporated" },
  ],
} satisfies UiConfigNode;
