import type { DerivedFactDefinition } from "../types";

/**
 * Defines reusable business classifications calculated before named rules run.
 * Rules consume these values through derived.* paths instead of repeating predicates.
 */
export const startupInvestmentDerivedFacts: Record<string, DerivedFactDefinition> = {
  // DEMO: uncomment this reusable classification before enabling the UI and
  // validation rules that reference derived.isLargeInvestment.
  // isLargeInvestment: {
  //   description: "Identifies investments of at least $5 million.",
  //   defaultValue: false,
  //   cases: [
  //     {
  //       value: true,
  //       when: { path: "requestData.investment.amount", op: "gte", value: 5_000_000 },
  //     },
  //   ],
  // },
  investmentVariant: {
    description: "Classifies the investment using current request data.",
    defaultValue: "STANDARD",
    cases: [{ value: "HIGH_RISK", when: { or: [{ path: "requestData.investment.amount", op: "gte", value: 5_000_000 }, { path: "requestData.company.stage", op: "in", value: ["SEED", "PRE_REVENUE"] }, { path: "requestData.risk.hasMaterialException", op: "eq", value: true }, { anyItem: { path: "requestData.exceptions", rule: { path: "$item.severity", op: "eq", value: "HIGH" } } }] } }],
  },
};
