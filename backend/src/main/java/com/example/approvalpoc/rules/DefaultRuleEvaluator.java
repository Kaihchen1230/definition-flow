package com.example.approvalpoc.rules;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DefaultRuleEvaluator implements RuleEvaluator {
    private static final int MAX_REFERENCE_DEPTH = 5;
    private final ObjectMapper objectMapper;

    public DefaultRuleEvaluator(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public RuleEvaluationResult evaluate(JsonNode rule, JsonNode context) {
        return evaluate(rule, context, Map.of());
    }

    @Override
    public RuleEvaluationResult evaluate(JsonNode rule, JsonNode context, Map<String, JsonNode> namedRules) {
        List<RuleTraceEntry> trace = new ArrayList<>();
        boolean result = evaluateNode(rule, context, context, namedRules, trace, 0);
        return new RuleEvaluationResult(result, trace);
    }

    private boolean evaluateNode(JsonNode rule, JsonNode rootContext, JsonNode scope, Map<String, JsonNode> namedRules, List<RuleTraceEntry> trace, int depth) {
        if (rule == null || rule.isMissingNode() || rule.isNull()) {
            trace.add(new RuleTraceEntry(null, null, null, null, null, false, "missingRule"));
            return false;
        }
        if (rule.has("rule")) {
            String ref = rule.path("rule").asText();
            if (depth >= MAX_REFERENCE_DEPTH) {
                trace.add(new RuleTraceEntry(ref, null, null, null, null, false, "maxReferenceDepth"));
                return false;
            }
            JsonNode referenced = namedRules.get(ref);
            if (referenced == null) {
                trace.add(new RuleTraceEntry(ref, null, null, null, null, false, "missingRuleReference"));
                return false;
            }
            trace.add(new RuleTraceEntry(ref, null, null, null, null, true, "ruleReference"));
            return evaluateNode(unwrapRule(referenced), rootContext, scope, namedRules, trace, depth + 1);
        }
        if (rule.has("and")) {
            boolean result = true;
            for (JsonNode child : rule.path("and")) {
                result = evaluateNode(child, rootContext, scope, namedRules, trace, depth) && result;
            }
            return result;
        }
        if (rule.has("or")) {
            boolean result = false;
            for (JsonNode child : rule.path("or")) {
                result = evaluateNode(child, rootContext, scope, namedRules, trace, depth) || result;
            }
            return result;
        }
        if (rule.has("not")) {
            return !evaluateNode(rule.path("not"), rootContext, scope, namedRules, trace, depth);
        }
        if (rule.has("allItems")) {
            return evaluateItems(rule.path("allItems"), rootContext, scope, namedRules, trace, depth, "all");
        }
        if (rule.has("anyItem")) {
            return evaluateItems(rule.path("anyItem"), rootContext, scope, namedRules, trace, depth, "any");
        }
        if (rule.has("noItems")) {
            return !evaluateItems(rule.path("noItems"), rootContext, scope, namedRules, trace, depth, "any");
        }
        return evaluatePredicate(rule, rootContext, scope, trace);
    }

    private JsonNode unwrapRule(JsonNode node) {
        return node.has("rule") ? node.path("rule") : node;
    }

    private boolean evaluateItems(JsonNode collectionRule, JsonNode rootContext, JsonNode scope, Map<String, JsonNode> namedRules, List<RuleTraceEntry> trace, int depth, String mode) {
        JsonNode collection = resolvePath(collectionRule.path("path").asText(), rootContext, scope);
        if (!collection.isArray()) {
            trace.add(new RuleTraceEntry(null, collectionRule.path("path").asText(), mode + "Items", null, nodeValue(collection), false, collection.isMissingNode() ? "missing" : "typeMismatch"));
            return false;
        }
        boolean sawMatchingItem = false;
        boolean aggregate = mode.equals("all");
        for (JsonNode item : collection) {
            JsonNode where = collectionRule.path("where");
            if (!where.isMissingNode() && !evaluateNode(where, rootContext, item, namedRules, new ArrayList<>(), depth)) {
                continue;
            }
            sawMatchingItem = true;
            boolean itemResult = evaluateNode(collectionRule.path("rule"), rootContext, item, namedRules, trace, depth);
            if (mode.equals("any")) {
                aggregate = aggregate || itemResult;
            } else {
                aggregate = aggregate && itemResult;
            }
        }
        if (!sawMatchingItem && mode.equals("all")) {
            return true;
        }
        return aggregate;
    }

    private boolean evaluatePredicate(JsonNode rule, JsonNode rootContext, JsonNode scope, List<RuleTraceEntry> trace) {
        String path = rule.path("path").asText();
        String op = rule.path("op").asText();
        JsonNode actualNode = resolvePath(path, rootContext, scope);
        JsonNode expectedNode = rule.path("value");

        boolean result;
        String status = actualNode.isMissingNode() ? "missing" : "ok";
        try {
            result = switch (op) {
                case "eq" -> actualNode.equals(expectedNode);
                case "neq" -> !actualNode.equals(expectedNode);
                case "in" -> in(actualNode, expectedNode);
                case "notIn" -> !in(actualNode, expectedNode);
                case "contains" -> contains(actualNode, expectedNode);
                case "gt", "gte", "lt", "lte" -> compare(actualNode, expectedNode, op);
                case "exists" -> !actualNode.isMissingNode();
                case "missing" -> actualNode.isMissingNode();
                case "empty" -> isEmpty(actualNode);
                case "notEmpty" -> !isEmpty(actualNode);
                case "count" -> actualNode.isArray() && actualNode.size() == expectedNode.asInt();
                case "minCount" -> actualNode.isArray() && actualNode.size() >= expectedNode.asInt();
                case "maxCount" -> actualNode.isArray() && actualNode.size() <= expectedNode.asInt();
                default -> false;
            };
            if (requiresArray(op) && !actualNode.isArray()) {
                status = actualNode.isMissingNode() ? "missing" : "typeMismatch";
                result = false;
            }
        } catch (RuntimeException e) {
            status = "typeMismatch";
            result = false;
        }

        trace.add(new RuleTraceEntry(null, path, op, nodeValue(expectedNode), nodeValue(actualNode), result, status));
        return result;
    }

    private JsonNode resolvePath(String path, JsonNode rootContext, JsonNode scope) {
        if (path == null || path.isBlank()) {
            return MissingNode.getInstance();
        }
        JsonNode current;
        String remaining;
        if (path.equals("$item")) {
            return scope;
        }
        if (path.startsWith("$item.")) {
            current = scope;
            remaining = path.substring("$item.".length());
        } else {
            current = rootContext;
            remaining = path;
        }
        for (String part : remaining.split("\\.")) {
            if (part.isBlank()) {
                continue;
            }
            if (current == null || current.isMissingNode() || current.isNull()) {
                return MissingNode.getInstance();
            }
            current = current.path(part);
        }
        return current == null ? MissingNode.getInstance() : current;
    }

    private boolean in(JsonNode actual, JsonNode expectedArray) {
        if (!expectedArray.isArray()) {
            return false;
        }
        for (JsonNode expected : expectedArray) {
            if (actual.equals(expected)) {
                return true;
            }
        }
        return false;
    }

    private boolean contains(JsonNode actualArray, JsonNode expected) {
        if (!actualArray.isArray()) {
            return false;
        }
        for (JsonNode item : actualArray) {
            if (item.equals(expected)) {
                return true;
            }
        }
        return false;
    }

    private boolean compare(JsonNode actual, JsonNode expected, String op) {
        if (!actual.isNumber() || !expected.isNumber()) {
            return false;
        }
        BigDecimal left = actual.decimalValue();
        BigDecimal right = expected.decimalValue();
        int comparison = left.compareTo(right);
        return switch (op) {
            case "gt" -> comparison > 0;
            case "gte" -> comparison >= 0;
            case "lt" -> comparison < 0;
            case "lte" -> comparison <= 0;
            default -> false;
        };
    }

    private boolean isEmpty(JsonNode node) {
        return node.isMissingNode()
                || node.isNull()
                || (node.isTextual() && node.asText().isBlank())
                || (node.isArray() && node.isEmpty())
                || (node.isObject() && !node.fields().hasNext());
    }

    private boolean requiresArray(String op) {
        return op.equals("contains") || op.equals("count") || op.equals("minCount") || op.equals("maxCount");
    }

    private Object nodeValue(JsonNode node) {
        if (node == null || node.isMissingNode()) {
            return null;
        }
        return objectMapper.convertValue(node, Object.class);
    }
}

