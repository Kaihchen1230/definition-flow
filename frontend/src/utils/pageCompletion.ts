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

  if (node.type === "field" && node.required && node.dataPath) {
    completion.requiredCount += 1;
    if (isMissing(getPath(data, node.dataPath))) {
      completion.missingCount += 1;
      completion.missingPaths.add(node.dataPath);
    }
  }

  if (node.type === "collection" && node.dataPath && node.requiredFields?.length) {
    const rows = getPath(data, node.dataPath);
    const applicableRows = Array.isArray(rows)
      ? rows
          .map((row, rowIndex) => ({ row, rowIndex }))
          .filter(({ row }) => {
            if (!node.filter) {
              return true;
            }
            const filterPath = node.filter.path.replace(/^\$item\.?/, "");
            return node.filter.op === "eq" && getPath(row, filterPath) === node.filter.value;
          })
      : [];
    if (applicableRows.length === 0) {
      if (node.required) {
        completion.requiredCount += 1;
        completion.missingCount += 1;
        completion.missingPaths.add(node.dataPath);
      }
    } else {
      applicableRows.forEach(({ row, rowIndex }) => {
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
