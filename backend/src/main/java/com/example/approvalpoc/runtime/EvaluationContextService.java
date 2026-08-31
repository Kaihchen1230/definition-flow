package com.example.approvalpoc.runtime;

import com.example.approvalpoc.calculation.CalculationService;
import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.dev.DemoUserEntity;
import com.example.approvalpoc.dev.DemoUserRepository;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EvaluationContextService {
    private final RequestCaseRepository requestCaseRepository;
    private final DemoUserRepository userRepository;
    private final DefinitionService definitionService;
    private final CalculationService calculationService;
    private final ObjectMapper objectMapper;

    public EvaluationContextService(
            RequestCaseRepository requestCaseRepository,
            DemoUserRepository userRepository,
            DefinitionService definitionService,
            CalculationService calculationService,
            ObjectMapper objectMapper
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.userRepository = userRepository;
        this.definitionService = definitionService;
        this.calculationService = calculationService;
        this.objectMapper = objectMapper;
    }

    public RuntimeBundle bundle(UUID requestCaseId, String userId, String scope) {
        RequestCaseEntity requestCase = requestCaseRepository.findById(requestCaseId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown request case: " + requestCaseId));
        DemoUserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown user: " + userId));

        JsonNode requestData = readJson(requestCase.getRequestData());
        JsonNode calculationDefinition = definitionService.activeDefinition(requestCase.getRequestType(), DefinitionModuleType.CALCULATIONS);

        ObjectNode context = objectMapper.createObjectNode();
        context.set("user", userNode(user));
        context.set("workflow", objectMapper.createObjectNode().put("state", requestCase.getWorkflowState()));
        context.set("request", requestNode(requestCase));
        context.set("requestData", requestData);
        context.set("businessContext", objectMapper.createObjectNode());
        context.set("derived", objectMapper.createObjectNode());
        context.set("calculations", objectMapper.createObjectNode());
        context.set("evaluation", evaluationNode(requestCase.getRequestType(), scope));

        JsonNode calculations = calculationService.calculationContext(requestCase.getId(), requestCase.getRequestType(), calculationDefinition, context);
        context.set("calculations", calculations);
        return new RuntimeBundle(requestCase, user, context);
    }

    private ObjectNode userNode(DemoUserEntity user) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("userId", user.getId());
        node.put("displayName", user.getDisplayName());
        node.put("role", user.getRole());
        node.set("entitlements", readJson(user.getEntitlements()));
        node.set("groups", readJson(user.getGroupsJson()));
        return node;
    }

    private ObjectNode requestNode(RequestCaseEntity requestCase) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", requestCase.getId().toString());
        node.put("requestType", requestCase.getRequestType());
        node.put("createdBy", requestCase.getCreatedBy());
        node.put("assignedTo", requestCase.getAssignedTo());
        return node;
    }

    private ObjectNode evaluationNode(String requestType, String scope) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("time", Instant.now().toString());
        node.put("scope", scope);
        node.set("definitionVersions", objectMapper.valueToTree(definitionService.activeVersions(requestType)));
        return node;
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read JSON", e);
        }
    }
}
