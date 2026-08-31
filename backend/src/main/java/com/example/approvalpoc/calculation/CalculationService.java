package com.example.approvalpoc.calculation;

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
    private final CalculationEngine calculationEngine;
    private final ObjectMapper objectMapper;

    public CalculationService(CalculationResultRepository repository, CalculationEngine calculationEngine, ObjectMapper objectMapper) {
        this.repository = repository;
        this.calculationEngine = calculationEngine;
        this.objectMapper = objectMapper;
    }

    public JsonNode calculationContext(UUID requestCaseId, String requestType, JsonNode calculationDefinition, JsonNode context) {
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
                        node.put("engineId", result.getEngineId());
                        node.put("ruleSetVersion", result.getRuleSetVersion());
                        boolean inputsChanged = !dependencyHash(definition, context).equals(result.getInputHash());
                        boolean ruleSetChanged = !calculationEngine.currentRuleSetVersion(requestType, calculationId, definition).equals(result.getRuleSetVersion());
                        boolean stale = inputsChanged || ruleSetChanged;
                        node.put("stale", stale);
                        node.set("staleReasons", stale ? staleReasons(definition, inputsChanged, ruleSetChanged) : objectMapper.createArrayNode());
                    }, () -> {
                        node.put("exists", false);
                        node.put("stale", true);
                        node.set("staleReasons", staleReasons(definition, true, false));
                    });
            calculations.set(calculationId, node);
        }
        return calculations;
    }

    @Transactional
    public CalculationResultEntity calculate(UUID requestCaseId, String userId, String requestType, String calculationId, JsonNode calculationDefinition, JsonNode context) {
        JsonNode definition = calculationDefinition.path("calculations").path(calculationId);
        CalculationEngineResult engineResult = calculationEngine.calculate(requestType, calculationId, definition, context);
        String inputHash = dependencyHash(definition, context);
        CalculationResultEntity entity = repository.findFirstByRequestCaseIdAndCalculationIdOrderByCalculatedAtDesc(requestCaseId, calculationId)
                .orElseGet(() -> new CalculationResultEntity(requestCaseId, calculationId, "{}", inputHash, userId, Instant.now()));
        entity.setResultJson(writeJson(engineResult.result()));
        entity.setInputHash(inputHash);
        entity.setEngineId(engineResult.engineId());
        entity.setRuleSetVersion(engineResult.ruleSetVersion());
        entity.setCalculatedBy(userId);
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

    private ArrayNode staleReasons(JsonNode definition, boolean includeDependencies, boolean includeRuleSetVersion) {
        ArrayNode reasons = objectMapper.createArrayNode();
        if (includeDependencies) {
            for (JsonNode dependency : definition.path("dependsOn")) {
                reasons.add(dependency.asText());
            }
        }
        if (includeRuleSetVersion) {
            reasons.add("calculationRuleSetVersion");
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
