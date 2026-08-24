package com.example.approvalpoc.derived;

import com.example.approvalpoc.rules.RuleCatalog;
import com.example.approvalpoc.rules.RuleEvaluator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DerivedFactService {
    private final RuleEvaluator ruleEvaluator;
    private final RuleCatalog ruleCatalog;
    private final ObjectMapper objectMapper;

    public DerivedFactService(RuleEvaluator ruleEvaluator, RuleCatalog ruleCatalog, ObjectMapper objectMapper) {
        this.ruleEvaluator = ruleEvaluator;
        this.ruleCatalog = ruleCatalog;
        this.objectMapper = objectMapper;
    }

    public JsonNode derive(JsonNode derivedDefinition, JsonNode context, JsonNode rulesDefinition) {
        ObjectNode derived = objectMapper.createObjectNode();
        Map<String, JsonNode> namedRules = ruleCatalog.namedRules(rulesDefinition);
        Iterator<Map.Entry<String, JsonNode>> fields = derivedDefinition.path("derivedFacts").fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            JsonNode definition = entry.getValue();
            JsonNode selected = definition.path("defaultValue");
            for (JsonNode candidate : definition.path("cases")) {
                if (ruleEvaluator.evaluate(candidate.path("when"), context, namedRules).result()) {
                    selected = candidate.path("value");
                    break;
                }
            }
            derived.set(entry.getKey(), selected);
        }
        return derived;
    }
}

