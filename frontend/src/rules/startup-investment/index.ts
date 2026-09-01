import type { FrontendRuleDefinition, NamedRuleDefinition } from "../types";
import { startupInvestmentCapabilities } from "./capabilities";
import { startupInvestmentUiRules } from "./uiRules";
import { startupInvestmentValidationRules } from "./validationRules";

/**
 * Public assembly point for the startup-investment rule domain. Callers depend
 * on this stable catalog while focused modules own each category's implementation.
 */
export const startupInvestmentRules = {
  capabilities: startupInvestmentCapabilities,
  uiRules: startupInvestmentUiRules,
  // Reserved for contextual non-workflow UI commands; none are configured yet.
  actionRules: {} satisfies Record<string, NamedRuleDefinition>,
  validationRules: startupInvestmentValidationRules,
} satisfies FrontendRuleDefinition;

export { startupInvestmentDerivedFacts } from "./derivedFacts";
export { resolveWorkflowActionLabel, startupInvestmentWorkflowActionRules } from "./workflowActionRules";
