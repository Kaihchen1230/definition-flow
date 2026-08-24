package com.example.approvalpoc.ui;

import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.rules.RuleCatalog;
import com.example.approvalpoc.rules.RuleEvaluationResult;
import com.example.approvalpoc.rules.RuleEvaluator;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.example.approvalpoc.validation.ValidationIssue;
import com.example.approvalpoc.validation.ValidationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class UiEvaluationService {
    private final DefinitionService definitionService;
    private final RuleEvaluator ruleEvaluator;
    private final RuleCatalog ruleCatalog;
    private final ValidationService validationService;
    private final ObjectMapper objectMapper;

    public UiEvaluationService(
            DefinitionService definitionService,
            RuleEvaluator ruleEvaluator,
            RuleCatalog ruleCatalog,
            ValidationService validationService,
            ObjectMapper objectMapper
    ) {
        this.definitionService = definitionService;
        this.ruleEvaluator = ruleEvaluator;
        this.ruleCatalog = ruleCatalog;
        this.validationService = validationService;
        this.objectMapper = objectMapper;
    }

    public ObjectNode evaluate(RuntimeBundle bundle) {
        JsonNode uiDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.UI);
        Map<String, JsonNode> namedRules = ruleCatalog.namedRules(bundle.rulesDefinition());
        List<ValidationIssue> renderIssues = validationService.validate(bundle.rulesDefinition(), bundle.context(), "render");
        List<ValidationIssue> submitIssues = validationService.validate(bundle.rulesDefinition(), bundle.context(), "submit");
        List<ValidationIssue> approveIssues = validationService.validate(bundle.rulesDefinition(), bundle.context(), "approve");

        ObjectNode response = objectMapper.createObjectNode();
        response.put("requestCaseId", bundle.requestCase().getId().toString());
        response.put("requestType", bundle.requestCase().getRequestType());
        response.put("workflowState", bundle.requestCase().getWorkflowState());
        response.set("actor", bundle.context().path("actor"));
        response.set("requestData", bundle.context().path("requestData"));
        response.set("derived", bundle.context().path("derived"));
        response.set("calculations", bundle.context().path("calculations"));
        response.set("definitionVersions", bundle.context().path("evaluation").path("definitionVersions"));
        response.put("canSave", canSave(bundle, namedRules));
        response.set("pages", evaluateChildren(uiDefinition.path("pages"), bundle.context(), namedRules, true, true));
        response.set("workflowActions", evaluateWorkflowActions(bundle, namedRules));
        response.set("validation", validationNode(renderIssues, submitIssues, approveIssues));
        return response;
    }

    private boolean canSave(RuntimeBundle bundle, Map<String, JsonNode> namedRules) {
        ObjectNode rule = objectMapper.createObjectNode();
        rule.set("or", objectMapper.createArrayNode()
                .add(objectMapper.createObjectNode().put("rule", "canEditInvestmentReview"))
                .add(objectMapper.createObjectNode().put("rule", "canEditRiskReview")));
        return ruleEvaluator.evaluate(rule, bundle.context(), namedRules).result();
    }

    private ArrayNode evaluateWorkflowActions(RuntimeBundle bundle, Map<String, JsonNode> namedRules) {
        JsonNode workflowDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.WORKFLOW);
        ArrayNode actions = objectMapper.createArrayNode();
        for (JsonNode transition : workflowDefinition.path("workflow").path("transitions")) {
            String from = transition.path("from").asText();
            if (!from.equals("*") && !from.equals(bundle.requestCase().getWorkflowState())) {
                continue;
            }
            ObjectNode action = objectMapper.createObjectNode();
            String actionId = transition.path("action").asText();
            RuleEvaluationResult enabledRule = evaluateOptionalRule(transition.path("enabledRule").asText(null), bundle.context(), namedRules, true);
            boolean enabled = enabledRule.result();
            action.put("id", actionId);
            action.put("label", labelForAction(actionId));
            action.put("visible", enabled);
            action.put("enabled", enabled);
            action.put("disabled", !enabled);
            ObjectNode debug = objectMapper.createObjectNode();
            debug.set("enabledRule", objectMapper.valueToTree(enabledRule));
            action.set("debug", debug);
            actions.add(action);
        }
        return actions;
    }

    private String labelForAction(String actionId) {
        return switch (actionId) {
            case "workflow.startInvestmentReview" -> "Start investment review";
            case "workflow.submitInvestmentReview" -> "Submit for investment approval";
            case "workflow.approveInvestmentReview" -> "Approve investment review";
            case "workflow.submitRiskReview" -> "Submit for final approval";
            case "workflow.approveFinalRequest" -> "Approve final request";
            case "workflow.decline" -> "Decline";
            case "workflow.withdraw" -> "Withdraw";
            default -> actionId;
        };
    }

    private ArrayNode evaluateChildren(JsonNode nodes, JsonNode context, Map<String, JsonNode> namedRules, boolean parentVisible, boolean parentEnabled) {
        ArrayNode result = objectMapper.createArrayNode();
        for (JsonNode node : nodes) {
            result.add(evaluateNode(node, context, namedRules, parentVisible, parentEnabled));
        }
        return result;
    }

    private ObjectNode evaluateNode(JsonNode node, JsonNode context, Map<String, JsonNode> namedRules, boolean parentVisible, boolean parentEnabled) {
        ObjectNode evaluated = node.deepCopy();
        RuleEvaluationResult visibleRule = evaluateOptionalRule(node.path("visibleRule").asText(null), context, namedRules, true);
        RuleEvaluationResult enabledRule = evaluateOptionalRule(node.path("enabledRule").asText(null), context, namedRules, true);
        boolean visible = parentVisible && visibleRule.result();
        boolean enabled = parentEnabled && enabledRule.result();
        evaluated.put("visible", visible);
        evaluated.put("enabled", enabled);
        evaluated.put("disabled", !enabled);
        ObjectNode debug = objectMapper.createObjectNode();
        debug.set("visibleRule", objectMapper.valueToTree(visibleRule));
        debug.set("enabledRule", objectMapper.valueToTree(enabledRule));
        evaluated.set("debug", debug);
        if (node.has("dataPath")) {
            evaluated.set("value", resolveRequestData(context.path("requestData"), node.path("dataPath").asText()));
        }
        if (node.has("children")) {
            evaluated.set("children", evaluateChildren(node.path("children"), context, namedRules, visible, enabled));
        }
        if (node.has("actions")) {
            evaluated.set("actions", evaluateChildren(node.path("actions"), context, namedRules, visible, enabled));
        }
        return evaluated;
    }

    private RuleEvaluationResult evaluateOptionalRule(String ruleId, JsonNode context, Map<String, JsonNode> namedRules, boolean defaultResult) {
        if (ruleId == null || ruleId.isBlank() || ruleId.equals("null")) {
            return new RuleEvaluationResult(defaultResult, List.of());
        }
        return ruleEvaluator.evaluate(objectMapper.createObjectNode().put("rule", ruleId), context, namedRules);
    }

    private JsonNode resolveRequestData(JsonNode requestData, String path) {
        JsonNode current = requestData;
        for (String part : path.split("\\.")) {
            current = current.path(part);
        }
        return current;
    }

    private ObjectNode validationNode(List<ValidationIssue> renderIssues, List<ValidationIssue> submitIssues, List<ValidationIssue> approveIssues) {
        ObjectNode node = objectMapper.createObjectNode();
        node.set("render", objectMapper.valueToTree(renderIssues));
        node.set("submit", objectMapper.valueToTree(submitIssues));
        node.set("approve", objectMapper.valueToTree(approveIssues));
        return node;
    }
}
