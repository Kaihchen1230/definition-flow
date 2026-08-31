import type { EvaluationContext, RawEvaluationContext, RuleEvaluationResult, ValidationIssue, WorkflowAction } from "../types/api";
import { evaluateRule } from "./evaluateRule";
import { startupInvestmentDerivedFacts, startupInvestmentRules, startupInvestmentWorkflowActionRules } from "./startupInvestmentRules";
import type { NamedRuleDefinition, ValidationScope } from "./types";

export const evaluateFrontendContext = (raw: RawEvaluationContext, requestData = raw.requestData): EvaluationContext => {
  const namedRules: Record<string, NamedRuleDefinition> = {
    ...startupInvestmentRules.capabilities,
    ...startupInvestmentRules.uiRules,
    ...startupInvestmentRules.actionRules,
    ...startupInvestmentRules.validationRules,
  };
  const base = {
    user: raw.user,
    workflow: { state: raw.workflowState },
    requestData,
    calculations: raw.calculations,
    derived: {} as Record<string, unknown>,
  };
  for (const [factId, definition] of Object.entries(startupInvestmentDerivedFacts)) {
    base.derived[factId] = definition.cases.find((candidate) => evaluateRule(candidate.when, base, namedRules).result)?.value ?? definition.defaultValue;
  }
  const ruleResults: Record<string, RuleEvaluationResult> = {};
  for (const [ruleId, definition] of Object.entries(namedRules)) {
    ruleResults[ruleId] = evaluateRule(definition.rule, base, namedRules);
  }
  const validation = Object.fromEntries((["render", "submit", "riskSubmit", "approve"] as ValidationScope[]).map((scope) => [scope, validationIssues(scope, base, namedRules)])) as EvaluationContext["validation"];
  const workflowActions = raw.workflowActions.map((action): WorkflowAction => {
    const enabledRule = startupInvestmentWorkflowActionRules[action.id] ?? null;
    const eligibility = enabledRule ? ruleResults[enabledRule] ?? { result: false, trace: [] } : { result: true, trace: [] };
    return { id: action.id, label: action.label, enabledRule, visible: eligibility.result, enabled: eligibility.result, disabled: !eligibility.result, debug: { enabledRule: eligibility } };
  });
  const canSave = evaluateRule({ or: [{ rule: "canEditInvestmentReview" }, { rule: "canEditRiskReview" }] }, base, namedRules).result;
  return { ...raw, requestData, derived: base.derived, canSave, ruleResults, workflowActions, validation };
};

const validationIssues = (scope: ValidationScope, context: Record<string, unknown>, namedRules: Record<string, NamedRuleDefinition>): ValidationIssue[] => Object.entries(startupInvestmentRules.validationRules)
  .filter(([, definition]) => definition.scope.includes(scope))
  .flatMap(([ruleId, definition]) => evaluateRule(definition.rule, context, namedRules).result ? [] : [{ ruleId, severity: definition.severity, message: definition.message, path: definition.nodeId ?? definition.pageId ?? "", pageId: definition.pageId ?? undefined }]);
