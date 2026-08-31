import type { EvaluationContext, RuleEvaluationResult, UiNode, UiRuleReference } from "../types/api";
import type { UiConfigNode } from "../config/uiDefinition";
import { enumOptions } from "../config/enumOptions";
import { getPath } from "./objectPath";

const defaultRuleResult = (result: boolean): RuleEvaluationResult => ({
  result,
  trace: [],
});

const evaluateRuleReference = (rule: UiRuleReference, context: EvaluationContext, defaultResult: boolean) => {
  if (!rule) {
    return defaultRuleResult(defaultResult);
  }
  return context.ruleResults[rule] ?? defaultRuleResult(false);
};

const evaluateNode = (node: UiConfigNode, context: EvaluationContext, parentVisible: boolean, parentEnabled: boolean): UiNode => {
  const visibleRule = evaluateRuleReference(node.visibleRule, context, true);
  const enabledRule = evaluateRuleReference(node.enabledRule, context, true);
  const requiredRule = evaluateRuleReference(node.requiredRule, context, false);
  const visible = parentVisible && visibleRule.result;
  const enabled = parentEnabled && enabledRule.result;
  const options = node.dataPath ? enumOptions[node.dataPath] : undefined;
  const conditionalRequiredFields = Object.entries(node.requiredFieldRules ?? {})
    .filter(([, rule]) => evaluateRuleReference(rule, context, false).result)
    .map(([field]) => field);

  return {
    ...node,
    visible,
    enabled,
    disabled: !enabled,
    required: node.required || requiredRule.result,
    requiredFields: [...new Set([...(node.requiredFields ?? []), ...conditionalRequiredFields])],
    constraints: options
      ? { ...node.constraints, allowedValues: options.map((option) => option.value) }
      : node.constraints,
    debug: {
      visibleRule,
      enabledRule,
      requiredRule,
    },
    value: node.dataPath
      ? getPath(context.requestData, node.dataPath)
      : node.calculationId
        ? context.calculations[node.calculationId]
        : undefined,
    children: node.children?.map((child) => evaluateNode(child, context, visible, enabled)),
    actions: node.actions?.map((action) => evaluateNode(action, context, visible, enabled)),
  };
};

export const evaluateUiDefinition = (pages: UiConfigNode[], context: EvaluationContext) => {
  return pages.map((page) => evaluateNode(page, context, true, true));
};
