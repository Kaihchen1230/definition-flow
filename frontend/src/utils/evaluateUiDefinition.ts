import type { EvaluationContext, RuleEvaluationResult, UiNode } from "../types/api";
import type { UiConfigNode } from "../config/uiDefinition";
import { getPath } from "./objectPath";

const defaultRuleResult = (result: boolean): RuleEvaluationResult => ({
  result,
  trace: [],
});

const evaluateRuleReference = (ruleId: string | undefined, context: EvaluationContext, defaultResult: boolean) => {
  if (!ruleId) {
    return defaultRuleResult(defaultResult);
  }
  return context.ruleResults[ruleId] ?? defaultRuleResult(false);
};

const evaluateNode = (node: UiConfigNode, context: EvaluationContext, parentVisible: boolean, parentEnabled: boolean): UiNode => {
  const visibleRule = evaluateRuleReference(node.visibleRule, context, true);
  const enabledRule = evaluateRuleReference(node.enabledRule, context, true);
  const visible = parentVisible && visibleRule.result;
  const enabled = parentEnabled && enabledRule.result;

  return {
    ...node,
    visible,
    enabled,
    disabled: !enabled,
    debug: {
      ...(node.debug ?? {}),
      visibleRule,
      enabledRule,
    },
    value: node.dataPath ? getPath(context.requestData, node.dataPath) : node.value,
    children: node.children?.map((child) => evaluateNode(child, context, visible, enabled)),
    actions: node.actions?.map((action) => evaluateNode(action, context, visible, enabled)),
  };
};

export const evaluateUiDefinition = (pages: UiConfigNode[], context: EvaluationContext) => {
  return pages.map((page) => evaluateNode(page, context, true, true));
};
