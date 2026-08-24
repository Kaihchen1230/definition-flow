export type EnumOption = {
  value: string;
  label: string;
};

export const yesNoNa = (): EnumOption[] => [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
  { value: "NA", label: "N/A" },
];

export const enumOptions: Record<string, EnumOption[]> = {
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
  indicators: [
    { value: "HIGH_BURN_RATE", label: "High burn rate" },
    { value: "PENDING_LITIGATION", label: "Pending litigation" },
    { value: "RELATED_PARTY_TRANSACTION", label: "Related-party transaction" },
    { value: "FOREIGN_OWNERSHIP", label: "Foreign ownership" },
    { value: "DATA_PRIVACY_EXPOSURE", label: "Data privacy exposure" },
  ],
};
