import type { UiNode } from "../types/api";
import { fieldValueIsValid, localToday, type FieldValidationContext } from "./fieldValidation";
import { getPath } from "./objectPath";

export type PageCompletion = {
  complete: boolean;
  missingCount: number;
  missingPaths: Set<string>;
  requiredCount: number;
};

const isMissing = (value: unknown) => value == null || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0);

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

const evaluateNodeCompletion = (node: UiNode, data: Record<string, any>, context: FieldValidationContext): PageCompletion => {
  const completion = emptyCompletion();
  if (!node.visible) {
    return completion;
  }

  if (node.type === "field" && node.required && node.dataPath) {
    completion.requiredCount += 1;
    const value = getPath(data, node.dataPath);
    if (isMissing(value) || !fieldValueIsValid(value, node.constraints, context)) {
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
          const value = getPath(row, field);
          if (isMissing(value) || !fieldValueIsValid(value, node.itemConstraints?.[field], context)) {
            completion.missingCount += 1;
            completion.missingPaths.add(path);
          }
        });
      });
      const sumConstraint = node.collectionConstraints?.sum;
      if (sumConstraint) {
        const values = applicableRows.map(({ row }) => getPath(row, sumConstraint.field));
        const total = values.every((value) => typeof value === "number" && Number.isFinite(value))
          ? values.reduce<number>((sum, value) => sum + (value as number), 0)
          : Number.NaN;
        if (!Number.isFinite(total) || (sumConstraint.min != null && total < sumConstraint.min) || (sumConstraint.max != null && total > sumConstraint.max)) {
          completion.requiredCount += 1;
          completion.missingCount += 1;
          completion.missingPaths.add(node.dataPath);
        }
      }
    }
  }

  node.children?.forEach((child) => mergeCompletion(completion, evaluateNodeCompletion(child, data, context)));
  node.actions?.forEach((action) => mergeCompletion(completion, evaluateNodeCompletion(action, data, context)));
  completion.complete = completion.missingCount === 0;
  return completion;
};

export const evaluatePageCompletion = (page: UiNode, data: Record<string, any>, context: FieldValidationContext = { today: localToday() }) => evaluateNodeCompletion(page, data, context);
