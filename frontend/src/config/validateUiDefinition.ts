import type { UiConfigNode } from "./uiDefinition";

type UiDefinitionValidationCatalog = {
  componentIds: Set<string>;
  dataPaths: Set<string>;
  optionPaths: Set<string>;
  ruleIds: Set<string>;
};

const optionComponents = new Set(["dropdown", "radioGroup", "checkboxGroup"]);

export const validateUiDefinition = (pages: UiConfigNode[], catalog: UiDefinitionValidationCatalog) => {
  const nodes = flattenNodes(pages);
  const errors: string[] = [];
  const seenIds = new Set<string>();

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
