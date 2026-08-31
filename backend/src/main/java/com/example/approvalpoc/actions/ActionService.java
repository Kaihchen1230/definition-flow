package com.example.approvalpoc.actions;

import com.example.approvalpoc.audit.AuditService;
import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.example.approvalpoc.runtime.EvaluationContextService;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionService {
    private final RequestCaseRepository requestCaseRepository;
    private final EvaluationContextService contextService;
    private final DefinitionService definitionService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public ActionService(
            RequestCaseRepository requestCaseRepository,
            EvaluationContextService contextService,
            DefinitionService definitionService,
            AuditService auditService,
            ObjectMapper objectMapper
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.contextService = contextService;
        this.definitionService = definitionService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ActionResult patchRequestData(UUID requestCaseId, String userId, RequestDataPatch patch, String frontendRuleCatalogVersion) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, userId, "save");
        RequestCaseEntity requestCase = bundle.requestCase();
        ObjectNode requestData = readRequestDataObject(requestCase);
        List<RequestDataPatch.PathUpdate> updates = patch == null || patch.updates() == null ? List.of() : patch.updates();
        for (RequestDataPatch.PathUpdate update : updates) {
            applyPathUpdate(requestData, update);
        }
        requestCase.setRequestData(writeJson(requestData));
        requestCase.touch();
        requestCaseRepository.save(requestCase);
        auditService.record(requestCaseId, "PATCH_REQUEST_DATA", userId, requestCase.getWorkflowState(), requestCase.getWorkflowState(), definitionService.activeVersions(requestCase.getRequestType()), Map.of(
                "paths", updates.stream().map(RequestDataPatch.PathUpdate::path).toList(),
                "frontendRuleCatalogVersion", frontendRuleCatalogVersion
        ));
        return new ActionResult(true, "Saved", Map.of("requestCaseId", requestCaseId.toString(), "paths", updates.stream().map(RequestDataPatch.PathUpdate::path).toList()));
    }

    @Transactional
    public ActionResult execute(UUID requestCaseId, String userId, String actionId, JsonNode payload, String frontendRuleCatalogVersion) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, userId, scopeFor(actionId));
        if (actionId.startsWith("workflow.")) {
            return workflowTransition(bundle, actionId, payload, frontendRuleCatalogVersion);
        }
        return new ActionResult(false, "Unsupported action: " + actionId, Map.of());
    }

    private ActionResult workflowTransition(RuntimeBundle bundle, String actionId, JsonNode payload, String frontendRuleCatalogVersion) {
        JsonNode workflowDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.WORKFLOW);
        JsonNode transition = findTransition(workflowDefinition, actionId, bundle.requestCase().getWorkflowState());
        if (transition.isMissingNode()) {
            return new ActionResult(false, "No transition is available from the current workflow state.", Map.of());
        }
        String from = bundle.requestCase().getWorkflowState();
        String to = transition.path("to").asText();
        bundle.requestCase().setWorkflowState(to);
        bundle.requestCase().touch();
        requestCaseRepository.save(bundle.requestCase());
        auditService.record(bundle.requestCase().getId(), actionId, bundle.user().getId(), from, to, definitionService.activeVersions(bundle.requestCase().getRequestType()), auditDetails(payload, frontendRuleCatalogVersion));
        return new ActionResult(true, "Workflow moved to " + to + ".", Map.of("from", from, "to", to));
    }

    private JsonNode findTransition(JsonNode workflowDefinition, String actionId, String currentState) {
        for (JsonNode transition : workflowDefinition.path("workflow").path("transitions")) {
            if (!transition.path("action").asText().equals(actionId)) {
                continue;
            }
            String from = transition.path("from").asText();
            if (from.equals("*") || from.equals(currentState)) {
                return transition;
            }
        }
        return MissingNode.getInstance();
    }

    private ObjectNode auditDetails(JsonNode payload, String frontendRuleCatalogVersion) {
        ObjectNode details = objectMapper.createObjectNode();
        if (payload != null && payload.isObject()) {
            details.setAll((ObjectNode) payload);
        } else if (payload != null && !payload.isNull()) {
            details.set("payload", payload);
        }
        details.put("frontendRuleCatalogVersion", frontendRuleCatalogVersion);
        return details;
    }

    private String scopeFor(String actionId) {
        if (actionId.startsWith("workflow.submitInvestmentReview") || actionId.startsWith("workflow.approveInvestment")) {
            return "submit";
        }
        if (actionId.startsWith("workflow.submitRiskReview")) {
            return "riskSubmit";
        }
        if (actionId.startsWith("workflow.approveRisk")) {
            return "approve";
        }
        return "render";
    }

    private ObjectNode readRequestDataObject(RequestCaseEntity requestCase) {
        try {
            JsonNode requestData = objectMapper.readTree(requestCase.getRequestData());
            if (!requestData.isObject()) {
                throw new IllegalStateException("Request data must be a JSON object");
            }
            return requestData.deepCopy();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read request data JSON", e);
        }
    }

    private void applyPathUpdate(ObjectNode requestData, RequestDataPatch.PathUpdate update) {
        if (update == null || update.path() == null || update.path().isBlank()) {
            throw new IllegalArgumentException("Patch update path is required");
        }
        String[] parts = update.path().split("\\.");
        ObjectNode current = requestData;
        for (int index = 0; index < parts.length - 1; index++) {
            String part = parts[index];
            JsonNode next = current.path(part);
            if (!next.isObject()) {
                next = objectMapper.createObjectNode();
                current.set(part, next);
            }
            current = (ObjectNode) next;
        }
        current.set(parts[parts.length - 1], update.value() == null ? NullNode.getInstance() : update.value());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write JSON", e);
        }
    }
}
