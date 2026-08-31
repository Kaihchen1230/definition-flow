import { describe, expect, it } from "vitest";
import { evaluateRule } from "./evaluateRule";
import type { RuleNode } from "./types";

const context = {
  value: 5,
  text: "hello",
  blank: "  ",
  list: ["A", "B"],
  emptyList: [],
  object: { key: "value" },
  items: [{ active: true, score: 10 }, { active: false, score: 2 }],
};

describe("evaluateRule", () => {
  it.each<[string, RuleNode]>([
    ["eq", { path: "value", op: "eq", value: 5 }],
    ["neq", { path: "value", op: "neq", value: 6 }],
    ["in", { path: "value", op: "in", value: [4, 5] }],
    ["notIn", { path: "value", op: "notIn", value: [6, 7] }],
    ["contains", { path: "list", op: "contains", value: "A" }],
    ["gt", { path: "value", op: "gt", value: 4 }],
    ["gte", { path: "value", op: "gte", value: 5 }],
    ["lt", { path: "value", op: "lt", value: 6 }],
    ["lte", { path: "value", op: "lte", value: 5 }],
    ["exists", { path: "object.key", op: "exists" }],
    ["missing", { path: "object.unknown", op: "missing" }],
    ["empty", { path: "blank", op: "empty" }],
    ["notEmpty", { path: "text", op: "notEmpty" }],
    ["count", { path: "list", op: "count", value: 2 }],
    ["minCount", { path: "list", op: "minCount", value: 1 }],
    ["maxCount", { path: "emptyList", op: "maxCount", value: 0 }],
  ])("supports %s", (_, rule) => {
    expect(evaluateRule(rule, context).result).toBe(true);
  });

  it("supports boolean composition and named references", () => {
    const named = { isFive: { description: "value is five", rule: { path: "value", op: "eq", value: 5 } as RuleNode } };
    expect(evaluateRule({ and: [{ rule: "isFive" }, { not: { path: "blank", op: "notEmpty" } }] }, context, named).result).toBe(true);
    expect(evaluateRule({ or: [{ path: "value", op: "eq", value: 0 }, { rule: "isFive" }] }, context, named).result).toBe(true);
  });

  it("evaluates allItems, anyItem, noItems, where, and $item paths", () => {
    expect(evaluateRule({ allItems: { path: "items", rule: { path: "$item.score", op: "gt", value: 0 } } }, context).result).toBe(true);
    expect(evaluateRule({ anyItem: { path: "items", rule: { path: "$item.active", op: "eq", value: true } } }, context).result).toBe(true);
    expect(evaluateRule({ noItems: { path: "items", rule: { path: "$item.score", op: "lt", value: 0 } } }, context).result).toBe(true);
    expect(evaluateRule({ allItems: { path: "items", where: { path: "$item.active", op: "eq", value: true }, rule: { path: "$item.score", op: "gte", value: 10 } } }, context).result).toBe(true);
  });

  it("does not coerce values and reports missing paths", () => {
    expect(evaluateRule({ path: "value", op: "eq", value: "5" }, context).result).toBe(false);
    const result = evaluateRule({ path: "unknown", op: "notEmpty" }, context);
    expect(result.result).toBe(false);
    expect(result.trace[0].status).toBe("missing");
  });
});
