package com.example.approvalpoc.rules;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class RuleCatalog {
    public Map<String, JsonNode> namedRules(JsonNode rulesDefinition) {
        Map<String, JsonNode> rules = new HashMap<>();
        collect(rulesDefinition.path("capabilities"), rules);
        collect(rulesDefinition.path("uiRules"), rules);
        collect(rulesDefinition.path("actionRules"), rules);
        collectValidationRules(rulesDefinition.path("validationRules"), rules);
        return rules;
    }

    private void collect(JsonNode container, Map<String, JsonNode> rules) {
        Iterator<Map.Entry<String, JsonNode>> fields = container.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            rules.put(entry.getKey(), entry.getValue().has("rule") ? entry.getValue().path("rule") : entry.getValue());
        }
    }

    private void collectValidationRules(JsonNode container, Map<String, JsonNode> rules) {
        Iterator<Map.Entry<String, JsonNode>> fields = container.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            if (entry.getValue().has("rule")) {
                rules.put(entry.getKey(), entry.getValue().path("rule"));
            }
        }
    }
}

