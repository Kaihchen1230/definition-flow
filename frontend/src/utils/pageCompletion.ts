import type { UiNode } from "../types/api";
import { getPath } from "./objectPath";

export type PageCompletion = {
  complete: boolean;
  missingCount: number;
  missingPaths: Set<string>;
  requiredCount: number;
};

const isMissing = (value: unknown) => value == null || (typeof value === "string" && value.trim() === "");

const emptyCompletion = (): PageCompletion => ({
  complete: true,
  missingCount: 0,
  missingPaths: new Set(),
  requiredCount: 0,
});

const mergeCompletion = (target: PageCompletion, source: PageCompletion) => {
  target.requiredCount += source.requiredCount;
  target.missingCount += source.missingCount;
  source.missingPaths.forEach((path) => target.missingPaths.add(path));
  target.complete = target.missingCount === 0;
};

const evaluateNodeCompletion = (node: UiNode, data: Record<string, any>): PageCompletion => {
  const completion = emptyCompletion();
  if (!node.visible) {
    return completion;
  }

  if (node.type === "collection" && node.dataPath && node.requiredFields?.length) {
    const rows = getPath(data, node.dataPath);
    if (!Array.isArray(rows) || rows.length === 0) {
      completion.requiredCount += node.requiredFields.length;
      completion.missingCount += node.requiredFields.length;
      node.requiredFields.forEach((field) => completion.missingPaths.add(`${node.dataPath}.0.${field}`));
    } else {
      rows.forEach((row, rowIndex) => {
        node.requiredFields?.forEach((field) => {
          const path = `${node.dataPath}.${rowIndex}.${field}`;
          completion.requiredCount += 1;
          if (isMissing(getPath(row, field))) {
            completion.missingCount += 1;
            completion.missingPaths.add(path);
          }
        });
      });
    }
  }

  node.children?.forEach((child) => mergeCompletion(completion, evaluateNodeCompletion(child, data)));
  node.actions?.forEach((action) => mergeCompletion(completion, evaluateNodeCompletion(action, data)));
  completion.complete = completion.missingCount === 0;
  return completion;
};

export const evaluatePageCompletion = (page: UiNode, data: Record<string, any>) => evaluateNodeCompletion(page, data);
