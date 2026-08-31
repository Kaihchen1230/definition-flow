export type EnumOption = {
  value: string;
  label: string;
};

export const yesNoNa = (): EnumOption[] => [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NA", label: "N/A" },
];

const confirmOrReferBack = (): EnumOption[] => [
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "REFER_BACK", label: "Refer back" },
];

export const enumOptions: Record<string, EnumOption[]> = {
  "approvalRequirements.investmentLevels": [
    { value: "LEVEL_1", label: "Level 1 — standard authority" },
    { value: "LEVEL_2", label: "Level 2 — elevated authority" },
    { value: "LEVEL_3", label: "Level 3 — highest authority" },
  ],
  "approvalRequirements.riskLevels": [
    { value: "LEVEL_1", label: "Level 1 — standard authority" },
    { value: "LEVEL_2", label: "Level 2 — elevated authority" },
    { value: "LEVEL_3", label: "Level 3 — senior authority" },
    { value: "LEVEL_4", label: "Level 4 — highest authority" },
  ],
  "company.stage": [
    { value: "SEED", label: "Seed" },
    { value: "PRE_REVENUE", label: "Pre-revenue" },
    { value: "GROWTH", label: "Growth" },
    { value: "LATE_STAGE", label: "Late stage" },
  ],
  "company.sector": [
    { value: "AI", label: "AI" },
    { value: "FINTECH", label: "FinTech" },
    { value: "HEALTHCARE", label: "Healthcare" },
    { value: "INFRASTRUCTURE", label: "Infrastructure" },
    { value: "OTHER", label: "Other" },
  ],
  "company.incorporated": yesNoNa(),
  "investment.instrument": [
    { value: "SAFE", label: "SAFE" },
    { value: "EQUITY", label: "Equity" },
    { value: "CONVERTIBLE_NOTE", label: "Convertible note" },
  ],
  "risk.recommendation": [
    { value: "APPROVE", label: "Approve" },
    { value: "DECLINE", label: "Decline" },
    { value: "REFER_BACK", label: "Refer back" },
  ],
  "risk.pageConfirmations.companyProfile": confirmOrReferBack(),
  "risk.pageConfirmations.investmentTerms": confirmOrReferBack(),
  "risk.pageConfirmations.foundersOwnership": confirmOrReferBack(),
  indicators: [
    { value: "HIGH_BURN_RATE", label: "High burn rate" },
    { value: "PENDING_LITIGATION", label: "Pending litigation" },
    { value: "RELATED_PARTY_TRANSACTION", label: "Related-party transaction" },
    { value: "FOREIGN_OWNERSHIP", label: "Foreign ownership" },
    { value: "DATA_PRIVACY_EXPOSURE", label: "Data privacy exposure" },
  ],
};
