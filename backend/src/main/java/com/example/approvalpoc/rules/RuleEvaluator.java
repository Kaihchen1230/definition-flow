package com.example.approvalpoc.rules;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;

public interface RuleEvaluator {
    RuleEvaluationResult evaluate(JsonNode rule, JsonNode context);

    RuleEvaluationResult evaluate(JsonNode rule, JsonNode context, Map<String, JsonNode> namedRules);
}
