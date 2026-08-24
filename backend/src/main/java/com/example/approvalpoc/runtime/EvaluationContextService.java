package com.example.approvalpoc.runtime;

import com.example.approvalpoc.calculation.CalculationService;
import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.derived.DerivedFactService;
import com.example.approvalpoc.dev.DemoActorEntity;
import com.example.approvalpoc.dev.DemoActorRepository;
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
    private final DemoActorRepository actorRepository;
    private final DefinitionService definitionService;
    private final DerivedFactService derivedFactService;
    private final CalculationService calculationService;
    private final ObjectMapper objectMapper;

    public EvaluationContextService(
            RequestCaseRepository requestCaseRepository,
            DemoActorRepository actorRepository,
            DefinitionService definitionService,
            DerivedFactService derivedFactService,
            CalculationService calculationService,
            ObjectMapper objectMapper
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.actorRepository = actorRepository;
        this.definitionService = definitionService;
        this.derivedFactService = derivedFactService;
        this.calculationService = calculationService;
        this.objectMapper = objectMapper;
    }

    public RuntimeBundle bundle(UUID requestCaseId, String actorId, String scope) {
        RequestCaseEntity requestCase = requestCaseRepository.findById(requestCaseId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown request case: " + requestCaseId));
        DemoActorEntity actor = actorRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown actor: " + actorId));

        JsonNode requestData = readJson(requestCase.getRequestData());
        JsonNode rules = definitionService.activeDefinition(requestCase.getRequestType(), DefinitionModuleType.RULES);
        JsonNode derivedDefinition = definitionService.activeDefinition(requestCase.getRequestType(), DefinitionModuleType.DERIVED_FACTS);
        JsonNode calculationDefinition = definitionService.activeDefinition(requestCase.getRequestType(), DefinitionModuleType.CALCULATIONS);

        ObjectNode context = objectMapper.createObjectNode();
        context.set("actor", actorNode(actor));
        context.set("workflow", objectMapper.createObjectNode().put("state", requestCase.getWorkflowState()));
        context.set("request", requestNode(requestCase));
        context.set("requestData", requestData);
        context.set("businessContext", objectMapper.createObjectNode());
        context.set("derived", objectMapper.createObjectNode());
        context.set("calculations", objectMapper.createObjectNode());
        context.set("evaluation", evaluationNode(requestCase.getRequestType(), scope));

        JsonNode derived = derivedFactService.derive(derivedDefinition, context, rules);
        context.set("derived", derived);
        JsonNode calculations = calculationService.calculationContext(requestCase.getId(), calculationDefinition, context);
        context.set("calculations", calculations);
        return new RuntimeBundle(requestCase, actor, context, rules);
    }

    private ObjectNode actorNode(DemoActorEntity actor) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("userId", actor.getId());
        node.put("displayName", actor.getDisplayName());
        node.put("role", actor.getRole());
        node.set("entitlements", readJson(actor.getEntitlements()));
        node.set("groups", readJson(actor.getGroupsJson()));
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

