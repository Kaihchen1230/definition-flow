package com.example.approvalpoc.calculation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

@Component
public class LocalPocCalculationEngine implements CalculationEngine {
    public static final String ENGINE_ID = "local-poc";
    private final ObjectMapper objectMapper;

    public LocalPocCalculationEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String currentRuleSetVersion(String requestType, String calculationId, JsonNode calculationDefinition) {
        requireSupportedCalculation(requestType, calculationId, calculationDefinition);
        String ruleSetVersion = calculationDefinition.path("ruleSetVersion").asText();
        if (ruleSetVersion.isBlank()) {
            throw new IllegalStateException("Local POC calculation requires ruleSetVersion: " + calculationId);
        }
        return ruleSetVersion;
    }

    @Override
    public CalculationEngineResult calculate(
            String requestType,
            String calculationId,
            JsonNode calculationDefinition,
            JsonNode context
    ) {
        requireSupportedCalculation(requestType, calculationId, calculationDefinition);

        int amount = context.path("requestData").path("investment").path("amount").asInt(0);
        String variant = investmentVariant(context);
        ArrayNode levels = objectMapper.createArrayNode();
        levels.add("INVESTMENT_APPROVER");
        levels.add("RISK_OFFICER");
        levels.add("RISK_APPROVER");
        ObjectNode result = objectMapper.createObjectNode();
        result.set("requiredLevels", levels);
        result.put("variantUsed", variant);
        result.put("amountUsed", amount);
        result.put("routeType", amount >= 5_000_000 || variant.equals("HIGH_RISK") ? "ENHANCED_RISK_CHAIN" : "STANDARD_APPROVAL_CHAIN");
        result.put("routingReason", routingReason(context, amount));

        return new CalculationEngineResult(result, ENGINE_ID, currentRuleSetVersion(requestType, calculationId, calculationDefinition));
    }

    private void requireSupportedCalculation(String requestType, String calculationId, JsonNode calculationDefinition) {
        String configuredEngine = calculationDefinition.path("engine").asText();
        if (!requestType.equals("startupInvestment") || !calculationId.equals("approvalRoute") || !configuredEngine.equals(ENGINE_ID)) {
            throw new IllegalArgumentException("Unsupported local POC calculation: " + requestType + "/" + calculationId + " using " + configuredEngine);
        }
    }

    private String investmentVariant(JsonNode context) {
        int amount = context.path("requestData").path("investment").path("amount").asInt(0);
        String stage = context.path("requestData").path("company").path("stage").asText();
        boolean materialException = context.path("requestData").path("risk").path("hasMaterialException").asBoolean(false);
        return amount >= 5_000_000 || stage.equals("SEED") || stage.equals("PRE_REVENUE") || materialException || hasHighSeverityException(context)
                ? "HIGH_RISK"
                : "STANDARD";
    }

    private String routingReason(JsonNode context, int amount) {
        if (amount >= 5_000_000) {
            return "Investment amount is at least $5M.";
        }
        String stage = context.path("requestData").path("company").path("stage").asText();
        if (stage.equals("SEED") || stage.equals("PRE_REVENUE")) {
            return "Company is Seed or Pre-revenue stage.";
        }
        if (context.path("requestData").path("risk").path("hasMaterialException").asBoolean(false)) {
            return "Request has a material exception.";
        }
        if (hasHighSeverityException(context)) {
            return "Request has a high-severity exception.";
        }
        return "Growth or Late-stage request below $5M with no material exception.";
    }

    private boolean hasHighSeverityException(JsonNode context) {
        for (JsonNode exception : context.path("requestData").path("exceptions")) {
            if (exception.path("severity").asText().equals("HIGH")) {
                return true;
            }
        }
        return false;
    }
}
