import type { UiConfigNode, UiNavigationGroup } from "./uiDefinition";

type UiDefinitionValidationCatalog = {
  componentIds: Set<string>;
  dataPaths: Set<string>;
  optionPaths: Set<string>;
  ruleIds: Set<string>;
};

const optionComponents = new Set(["dropdown", "radioGroup", "checkboxGroup"]);

export const validateUiDefinition = (groups: UiNavigationGroup[], catalog: UiDefinitionValidationCatalog) => {
  const pages = groups.flatMap((group) => group.pages);
  const nodes = flattenNodes(pages);
  const errors: string[] = [];
  const seenGroupIds = new Set<string>();
  const seenIds = new Set<string>();

  groups.forEach((group) => {
    if (seenGroupIds.has(group.id)) {
      errors.push(`Duplicate navigation group id: ${group.id}`);
    }
    seenGroupIds.add(group.id);
    if (group.pages.length === 0) {
      errors.push(`Navigation group has no configured pages: ${group.id}`);
    }
  });

  nodes.forEach((node) => {
    if (seenIds.has(node.id)) {
      errors.push(`Duplicate UI node id: ${node.id}`);
    }
    seenIds.add(node.id);
  });

  nodes.forEach((node) => {
    (["visibleRule", "enabledRule", "requiredRule"] as const).forEach((ruleProperty) => {
      const ruleId = node[ruleProperty];
      if (ruleId && !catalog.ruleIds.has(ruleId)) {
        errors.push(`Unknown ${ruleProperty} '${ruleId}' on node ${node.id}`);
      }
    });
    Object.entries(node.requiredFieldRules ?? {}).forEach(([field, ruleId]) => {
      if (ruleId && !catalog.ruleIds.has(ruleId)) {
        errors.push(`Unknown requiredFieldRules rule '${ruleId}' for '${field}' on node ${node.id}`);
      }
    });
    if (node.component && !catalog.componentIds.has(node.component)) {
      errors.push(`Unknown component '${node.component}' on node ${node.id}`);
    }
    if (node.dataPath && !catalog.dataPaths.has(node.dataPath)) {
      errors.push(`Unknown dataPath '${node.dataPath}' on node ${node.id}`);
    }
    if (node.component && optionComponents.has(node.component) && node.dataPath && !catalog.optionPaths.has(node.dataPath)) {
      errors.push(`No options configured for ${node.component} node ${node.id} at ${node.dataPath}`);
    }
  });

  return errors;
};

const flattenNodes = (nodes: UiConfigNode[]): UiConfigNode[] => nodes.flatMap((node) => [
  node,
  ...flattenNodes(node.children ?? []),
  ...flattenNodes(node.actions ?? []),
]);
