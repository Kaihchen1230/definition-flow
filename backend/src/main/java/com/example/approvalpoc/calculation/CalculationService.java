package com.example.approvalpoc.calculation;

import com.example.approvalpoc.rules.DefaultRuleEvaluator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CalculationService {
    private final CalculationResultRepository repository;
    private final ObjectMapper objectMapper;

    public CalculationService(CalculationResultRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public JsonNode calculationContext(UUID requestCaseId, JsonNode calculationDefinition, JsonNode context) {
        ObjectNode calculations = objectMapper.createObjectNode();
        Iterator<Map.Entry<String, JsonNode>> fields = calculationDefinition.path("calculations").fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            String calculationId = entry.getKey();
            JsonNode definition = entry.getValue();
            ObjectNode node = objectMapper.createObjectNode();
            repository.findFirstByRequestCaseIdAndCalculationIdOrderByCalculatedAtDesc(requestCaseId, calculationId)
                    .ifPresentOrElse(result -> {
                        node.put("exists", true);
                        node.set("result", readJson(result.getResultJson()));
                        node.put("calculatedAt", result.getCalculatedAt().toString());
                        node.put("calculatedBy", result.getCalculatedBy());
                        String currentHash = dependencyHash(definition, context);
                        boolean stale = !currentHash.equals(result.getInputHash());
                        node.put("stale", stale);
                        node.set("staleReasons", stale ? staleReasons(definition) : objectMapper.createArrayNode());
                    }, () -> {
                        node.put("exists", false);
                        node.put("stale", true);
                        node.set("staleReasons", staleReasons(definition));
                    });
            calculations.set(calculationId, node);
        }
        return calculations;
    }

    @Transactional
    public CalculationResultEntity calculateApprovalRoute(UUID requestCaseId, String actorId, JsonNode calculationDefinition, JsonNode context) {
        JsonNode definition = calculationDefinition.path("calculations").path("approvalRoute");
        int amount = context.path("requestData").path("investment").path("amount").asInt(0);
        String variant = context.path("derived").path("investmentVariant").asText("STANDARD");
        ArrayNode levels = objectMapper.createArrayNode();
        levels.add("INVESTMENT_APPROVER");
        if (amount >= 5_000_000 || variant.equals("HIGH_RISK")) {
            levels.add("RISK_APPROVER");
        }
        ObjectNode result = objectMapper.createObjectNode();
        result.set("requiredLevels", levels);
        result.put("variantUsed", variant);
        result.put("amountUsed", amount);

        String inputHash = dependencyHash(definition, context);
        CalculationResultEntity entity = repository.findFirstByRequestCaseIdAndCalculationIdOrderByCalculatedAtDesc(requestCaseId, "approvalRoute")
                .orElseGet(() -> new CalculationResultEntity(requestCaseId, "approvalRoute", "{}", inputHash, actorId, Instant.now()));
        entity.setResultJson(writeJson(result));
        entity.setInputHash(inputHash);
        entity.setCalculatedBy(actorId);
        entity.setCalculatedAt(Instant.now());
        return repository.save(entity);
    }

    public String dependencyHash(JsonNode calculationDefinition, JsonNode context) {
        ObjectNode snapshot = objectMapper.createObjectNode();
        for (JsonNode dependency : calculationDefinition.path("dependsOn")) {
            String path = dependency.asText();
            snapshot.set(path, resolvePath(context, path));
        }
        return sha256(writeJson(snapshot));
    }

    private ArrayNode staleReasons(JsonNode definition) {
        ArrayNode reasons = objectMapper.createArrayNode();
        for (JsonNode dependency : definition.path("dependsOn")) {
            reasons.add(dependency.asText());
        }
        return reasons;
    }

    private JsonNode resolvePath(JsonNode context, String path) {
        JsonNode current = context;
        for (String part : path.split("\\.")) {
            current = current.path(part);
        }
        return current;
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read calculation JSON", e);
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write calculation JSON", e);
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return "sha256:" + HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}

