package com.example.approvalpoc.actions;

import com.example.approvalpoc.audit.AuditService;
import com.example.approvalpoc.calculation.CalculationService;
import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.example.approvalpoc.rules.RuleCatalog;
import com.example.approvalpoc.rules.RuleEvaluator;
import com.example.approvalpoc.runtime.EvaluationContextService;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.example.approvalpoc.validation.ValidationIssue;
import com.example.approvalpoc.validation.ValidationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActionService {
    private final RequestCaseRepository requestCaseRepository;
    private final EvaluationContextService contextService;
    private final DefinitionService definitionService;
    private final RuleEvaluator ruleEvaluator;
    private final RuleCatalog ruleCatalog;
    private final ValidationService validationService;
    private final CalculationService calculationService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public ActionService(
            RequestCaseRepository requestCaseRepository,
            EvaluationContextService contextService,
            DefinitionService definitionService,
            RuleEvaluator ruleEvaluator,
            RuleCatalog ruleCatalog,
            ValidationService validationService,
            CalculationService calculationService,
            AuditService auditService,
            ObjectMapper objectMapper
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.contextService = contextService;
        this.definitionService = definitionService;
        this.ruleEvaluator = ruleEvaluator;
        this.ruleCatalog = ruleCatalog;
        this.validationService = validationService;
        this.calculationService = calculationService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ActionResult patchRequestData(UUID requestCaseId, String userId, RequestDataPatch patch) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, userId, "save");
        if (!canSave(bundle)) {
            return new ActionResult(false, "Save is not allowed for this user or workflow state.", Map.of());
        }
        RequestCaseEntity requestCase = bundle.requestCase();
        ObjectNode requestData = readRequestDataObject(requestCase);
        List<RequestDataPatch.PathUpdate> updates = patch == null || patch.updates() == null ? List.of() : patch.updates();
        for (RequestDataPatch.PathUpdate update : updates) {
            applyPathUpdate(requestData, update);
        }
        requestCase.setRequestData(writeJson(requestData));
        requestCase.touch();
        requestCaseRepository.save(requestCase);
        auditService.record(requestCaseId, "PATCH_REQUEST_DATA", userId, requestCase.getWorkflowState(), requestCase.getWorkflowState(), definitionService.activeVersions(requestCase.getRequestType()), Map.of("paths", updates.stream().map(RequestDataPatch.PathUpdate::path).toList()));
        return new ActionResult(true, "Saved", Map.of("requestCaseId", requestCaseId.toString(), "paths", updates.stream().map(RequestDataPatch.PathUpdate::path).toList()));
    }

    private boolean canSave(RuntimeBundle bundle) {
        ObjectNode rule = objectMapper.createObjectNode();
        rule.set("or", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode().put("rule", "canEditInvestmentReview"))
                .add(objectMapper.createObjectNode().put("rule", "canEditRiskReview")));
        return ruleEvaluator.evaluate(rule, bundle.context(), ruleCatalog.namedRules(bundle.rulesDefinition())).result();
    }

    @Transactional
    public ActionResult execute(UUID requestCaseId, String userId, String actionId, JsonNode payload) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, userId, scopeFor(actionId));
        if (actionId.equals("calculateApprovalRoute")) {
            return calculateApprovalRoute(bundle);
        }
        if (actionId.startsWith("workflow.")) {
            return workflowTransition(bundle, actionId, payload);
        }
        return new ActionResult(false, "Unsupported action: " + actionId, Map.of());
    }

    private ActionResult calculateApprovalRoute(RuntimeBundle bundle) {
        JsonNode rules = bundle.rulesDefinition();
        JsonNode actionRule = rules.path("actionRules").path("canCalculateApprovalRoute").path("rule");
        if (!ruleEvaluator.evaluate(actionRule, bundle.context(), ruleCatalog.namedRules(rules)).result()) {
            return new ActionResult(false, "Calculate approval route is not allowed.", Map.of());
        }
        JsonNode calculationDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.CALCULATIONS);
        calculationService.calculateApprovalRoute(bundle.requestCase().getId(), bundle.user().getId(), calculationDefinition, bundle.context());
        auditService.record(bundle.requestCase().getId(), "CALCULATE_APPROVAL_ROUTE", bundle.user().getId(), bundle.requestCase().getWorkflowState(), bundle.requestCase().getWorkflowState(), definitionService.activeVersions(bundle.requestCase().getRequestType()), Map.of());
        return new ActionResult(true, "Approval route calculated.", Map.of());
    }

    private ActionResult workflowTransition(RuntimeBundle bundle, String actionId, JsonNode payload) {
        String validationScope = switch (actionId) {
            case "workflow.submitInvestmentReview" -> "submit";
            case "workflow.approveFinalRequest" -> "approve";
            default -> "render";
        };
        if (!validationScope.equals("render")) {
            List<ValidationIssue> issues = validationService.validate(bundle.rulesDefinition(), bundle.context(), validationScope);
            if (!issues.isEmpty()) {
                return new ActionResult(false, "Blocking validations must be resolved.", Map.of("issues", issues));
            }
        }
        JsonNode workflowDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.WORKFLOW);
        JsonNode transition = findTransition(workflowDefinition, actionId, bundle.requestCase().getWorkflowState());
        if (transition.isMissingNode()) {
            return new ActionResult(false, "No transition is available from the current workflow state.", Map.of());
        }
        String enabledRule = transition.path("enabledRule").asText("");
        if (!enabledRule.isBlank() && !ruleEvaluator.evaluate(objectMapper.createObjectNode().put("rule", enabledRule), bundle.context(), ruleCatalog.namedRules(bundle.rulesDefinition())).result()) {
            return new ActionResult(false, "Workflow action is not allowed.", Map.of("enabledRule", enabledRule));
        }
        String from = bundle.requestCase().getWorkflowState();
        String to = transition.path("to").asText();
        bundle.requestCase().setWorkflowState(to);
        bundle.requestCase().touch();
        requestCaseRepository.save(bundle.requestCase());
        auditService.record(bundle.requestCase().getId(), actionId, bundle.user().getId(), from, to, definitionService.activeVersions(bundle.requestCase().getRequestType()), payload == null ? Map.of() : payload);
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

    private String scopeFor(String actionId) {
        if (actionId.equals("workflow.submitInvestmentReview")) {
            return "submit";
        }
        if (actionId.equals("workflow.approveFinalRequest")) {
            return "approve";
        }
        if (actionId.equals("calculateApprovalRoute")) {
            return "calculateApprovalRoute";
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
