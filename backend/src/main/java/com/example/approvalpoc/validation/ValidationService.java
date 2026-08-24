package com.example.approvalpoc.validation;

import com.example.approvalpoc.rules.RuleCatalog;
import com.example.approvalpoc.rules.RuleEvaluationResult;
import com.example.approvalpoc.rules.RuleEvaluator;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ValidationService {
    private final RuleEvaluator ruleEvaluator;
    private final RuleCatalog ruleCatalog;

    public ValidationService(RuleEvaluator ruleEvaluator, RuleCatalog ruleCatalog) {
        this.ruleEvaluator = ruleEvaluator;
        this.ruleCatalog = ruleCatalog;
    }

    public List<ValidationIssue> validate(JsonNode rulesDefinition, JsonNode context, String scope) {
        List<ValidationIssue> issues = new ArrayList<>();
        Map<String, JsonNode> namedRules = ruleCatalog.namedRules(rulesDefinition);
        Iterator<Map.Entry<String, JsonNode>> fields = rulesDefinition.path("validationRules").fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            JsonNode definition = entry.getValue();
            if (!appliesToScope(definition.path("scope"), scope)) {
                continue;
            }
            RuleEvaluationResult result = ruleEvaluator.evaluate(definition.path("rule"), context, namedRules);
            if (!result.result()) {
                issues.add(new ValidationIssue(
                        entry.getKey(),
                        definition.path("severity").asText("blocking"),
                        scopes(definition.path("scope")),
                        definition.path("pageId").asText(""),
                        definition.path("sectionId").asText(""),
                        definition.path("nodeId").asText(""),
                        firstTracePath(result),
                        definition.path("message").asText(entry.getKey() + " failed")
                ));
            }
        }
        return issues;
    }

    private boolean appliesToScope(JsonNode scopes, String scope) {
        for (JsonNode candidate : scopes) {
            if (candidate.asText().equals(scope)) {
                return true;
            }
        }
        return false;
    }

    private List<String> scopes(JsonNode scopes) {
        List<String> values = new ArrayList<>();
        for (JsonNode scope : scopes) {
            values.add(scope.asText());
        }
        return values;
    }

    private String firstTracePath(RuleEvaluationResult result) {
        return result.trace().stream()
                .filter(trace -> trace.path() != null)
                .map(trace -> trace.path())
                .findFirst()
                .orElse("");
    }
}

