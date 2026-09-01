export const entitlementLabels: Record<string, string> = {
  EDIT_INVESTMENT_REQUEST: "Edit investment request",
  APPROVE_INVESTMENT_LEVEL_1: "Approve investment level 1",
  APPROVE_INVESTMENT_LEVEL_2: "Approve investment level 2",
  APPROVE_INVESTMENT_LEVEL_3: "Approve investment level 3",
  EDIT_RISK_REVIEW: "Edit risk review",
  APPROVE_RISK_LEVEL_1: "Approve risk level 1",
  APPROVE_RISK_LEVEL_2: "Approve risk level 2",
  APPROVE_RISK_LEVEL_3: "Approve risk level 3",
  APPROVE_RISK_LEVEL_4: "Approve risk level 4",
  DECLINE_REQUEST: "Decline request",
  WITHDRAW_REQUEST: "Withdraw request",
  VIEW_REQUEST: "View request",
};

export const formatEntitlement = (entitlement: string) => entitlementLabels[entitlement]
  ?? entitlement.toLowerCase().replace(/_/g, " ").replace(/^./, (first: string) => first.toUpperCase());
