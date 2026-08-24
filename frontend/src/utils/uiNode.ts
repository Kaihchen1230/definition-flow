import type { UiNode } from "../types/api";

export const collectDataPaths = (node?: UiNode) => {
  const dataPaths = new Set<string>();

  const visit = (current?: UiNode) => {
    if (!current || !current.visible) {
      return;
    }
    if (current.dataPath) {
      dataPaths.add(current.dataPath);
    }
    current.children?.forEach(visit);
    current.actions?.forEach(visit);
  };

  visit(node);
  return [...dataPaths];
};
