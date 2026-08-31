import type { RuleEvaluationResult, RuleTraceEntry } from "../types/api";
import type { NamedRuleDefinition, RuleNode, RuleOperator } from "./types";

const MAX_REFERENCE_DEPTH = 5;
const missing = Symbol("missing");
type RuleContext = Record<string, unknown>;

export const evaluateRule = (rule: RuleNode, context: RuleContext, namedRules: Record<string, NamedRuleDefinition> = {}): RuleEvaluationResult => {
  const trace: RuleTraceEntry[] = [];
  const result = evaluateNode(rule, context, context, namedRules, trace, 0);
  return { result, trace };
};

const evaluateNode = (rule: RuleNode, root: RuleContext, scope: unknown, namedRules: Record<string, NamedRuleDefinition>, trace: RuleTraceEntry[], depth: number): boolean => {
  if ("rule" in rule) {
    const referenced = namedRules[rule.rule];
    if (depth >= MAX_REFERENCE_DEPTH) {
      trace.push(entry(rule.rule, null, null, null, null, false, "maxReferenceDepth"));
      return false;
    }
    if (!referenced) {
      trace.push(entry(rule.rule, null, null, null, null, false, "missingRuleReference"));
      return false;
    }
    trace.push(entry(rule.rule, null, null, null, null, true, "ruleReference"));
    return evaluateNode(referenced.rule, root, scope, namedRules, trace, depth + 1);
  }
  if ("and" in rule) return rule.and.reduce((result, child) => evaluateNode(child, root, scope, namedRules, trace, depth) && result, true);
  if ("or" in rule) return rule.or.reduce((result, child) => evaluateNode(child, root, scope, namedRules, trace, depth) || result, false);
  if ("not" in rule) return !evaluateNode(rule.not, root, scope, namedRules, trace, depth);
  if ("allItems" in rule) return evaluateCollection(rule.allItems, "all", root, scope, namedRules, trace, depth);
  if ("anyItem" in rule) return evaluateCollection(rule.anyItem, "any", root, scope, namedRules, trace, depth);
  if ("noItems" in rule) return !evaluateCollection(rule.noItems, "any", root, scope, namedRules, trace, depth);
  return evaluatePredicate(rule.path, rule.op, rule.value, root, scope, trace);
};

const evaluateCollection = (collectionRule: { path: string; where?: RuleNode; rule: RuleNode }, mode: "all" | "any", root: RuleContext, scope: unknown, namedRules: Record<string, NamedRuleDefinition>, trace: RuleTraceEntry[], depth: number) => {
  const collection = resolvePath(collectionRule.path, root, scope);
  if (!Array.isArray(collection)) {
    trace.push(entry(null, collectionRule.path, `${mode}Items`, null, valueForTrace(collection), false, collection === missing ? "missing" : "typeMismatch"));
    return false;
  }
  const matching = collection.filter((item) => !collectionRule.where || evaluateNode(collectionRule.where, root, item, namedRules, [], depth));
  if (mode === "all" && matching.length === 0) return true;
  const results = matching.map((item) => evaluateNode(collectionRule.rule, root, item, namedRules, trace, depth));
  return mode === "all" ? results.every(Boolean) : results.some(Boolean);
};

const evaluatePredicate = (path: string, op: RuleOperator, expected: unknown, root: RuleContext, scope: unknown, trace: RuleTraceEntry[]) => {
  const actual = resolvePath(path, root, scope);
  let status = actual === missing ? "missing" : "ok";
  let result = false;
  switch (op) {
    case "eq": result = equal(actual, expected); break;
    case "neq": result = !equal(actual, expected); break;
    case "in": result = Array.isArray(expected) && expected.some((value) => equal(actual, value)); break;
    case "notIn": result = Array.isArray(expected) && !expected.some((value) => equal(actual, value)); break;
    case "contains": result = Array.isArray(actual) && actual.some((value) => equal(value, expected)); break;
    case "gt": case "gte": case "lt": case "lte": result = compare(actual, expected, op); break;
    case "exists": result = actual !== missing; break;
    case "missing": result = actual === missing; break;
    case "empty": result = isEmpty(actual); break;
    case "notEmpty": result = !isEmpty(actual); break;
    case "count": result = Array.isArray(actual) && actual.length === expected; break;
    case "minCount": result = Array.isArray(actual) && typeof expected === "number" && actual.length >= expected; break;
    case "maxCount": result = Array.isArray(actual) && typeof expected === "number" && actual.length <= expected; break;
  }
  if (["contains", "count", "minCount", "maxCount"].includes(op) && !Array.isArray(actual)) {
    status = actual === missing ? "missing" : "typeMismatch";
    result = false;
  }
  trace.push(entry(null, path, op, expected ?? null, valueForTrace(actual), result, status));
  return result;
};

const resolvePath = (path: string, root: RuleContext, scope: unknown): unknown => {
  if (!path) return missing;
  if (path === "$item") return scope;
  let current: unknown = path.startsWith("$item.") ? scope : root;
  const remaining = path.startsWith("$item.") ? path.slice(6) : path;
  for (const part of remaining.split(".")) {
    if (!part) continue;
    if (current === null || typeof current !== "object" || !(part in current)) return missing;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
};

const equal = (left: unknown, right: unknown) => left !== missing && JSON.stringify(left) === JSON.stringify(right);
const compare = (left: unknown, right: unknown, op: "gt" | "gte" | "lt" | "lte") => typeof left === "number" && typeof right === "number" && ({ gt: left > right, gte: left >= right, lt: left < right, lte: left <= right })[op];
const isEmpty = (value: unknown) => value === missing || value === null || value === undefined || (typeof value === "string" && value.trim() === "") || (Array.isArray(value) && value.length === 0) || (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0);
const valueForTrace = (value: unknown) => value === missing ? null : value;
const entry = (ruleId: string | null, path: string | null, op: string | null, expected: unknown, actual: unknown, result: boolean, status: string): RuleTraceEntry => ({ ruleId, path, op, expected, actual, result, status });
