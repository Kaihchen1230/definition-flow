package com.example.approvalpoc.requestcase.evaluation;

import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

@Service
public class RequestEvaluationService {
    private final DefinitionService definitionService;
    private final ObjectMapper objectMapper;

    public RequestEvaluationService(
            DefinitionService definitionService,
            ObjectMapper objectMapper
    ) {
        this.definitionService = definitionService;
        this.objectMapper = objectMapper;
    }

    public ObjectNode evaluate(RuntimeBundle bundle) {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("requestCaseId", bundle.requestCase().getId().toString());
        response.put("requestType", bundle.requestCase().getRequestType());
        response.put("workflowState", bundle.requestCase().getWorkflowState());
        response.set("user", bundle.context().path("user"));
        response.set("requestData", bundle.context().path("requestData"));
        response.set("calculations", bundle.context().path("calculations"));
        response.set("definitionVersions", bundle.context().path("evaluation").path("definitionVersions"));
        response.set("workflowActions", workflowActionDefinitions(bundle));
        return response;
    }

    private ArrayNode workflowActionDefinitions(RuntimeBundle bundle) {
        JsonNode workflowDefinition = definitionService.activeDefinition(bundle.requestCase().getRequestType(), DefinitionModuleType.WORKFLOW);
        ArrayNode actions = objectMapper.createArrayNode();
        for (JsonNode transition : workflowDefinition.path("workflow").path("transitions")) {
            String from = transition.path("from").asText();
            if (!from.equals("*") && !from.equals(bundle.requestCase().getWorkflowState())) {
                continue;
            }
            ObjectNode action = objectMapper.createObjectNode();
            String actionId = transition.path("action").asText();
            action.put("id", actionId);
            action.put("label", labelForAction(actionId));
            actions.add(action);
        }
        return actions;
    }

    private String labelForAction(String actionId) {
        return switch (actionId) {
            case "workflow.startInvestmentReview" -> "Start investment review";
            case "workflow.submitInvestmentReviewLevel1" -> "Submit to Investment Level 1";
            case "workflow.submitInvestmentReviewLevel2" -> "Submit to Investment Level 2";
            case "workflow.submitInvestmentReviewLevel3" -> "Submit to Investment Level 3";
            case "workflow.submitRiskReviewLevel1" -> "Submit to Risk Level 1";
            case "workflow.submitRiskReviewLevel2" -> "Submit to Risk Level 2";
            case "workflow.submitRiskReviewLevel3" -> "Submit to Risk Level 3";
            case "workflow.submitRiskReviewLevel4" -> "Submit to Risk Level 4";
            case "workflow.decline" -> "Decline request";
            case "workflow.withdraw" -> "Withdraw request";
            default -> approvalLabel(actionId);
        };
    }

    private String approvalLabel(String actionId) {
        var nextLevel = java.util.regex.Pattern.compile("workflow\\.approve(Investment|Risk)Level(\\d)ToLevel(\\d)").matcher(actionId);
        if (nextLevel.matches()) {
            return "Approve " + nextLevel.group(1) + " Level " + nextLevel.group(2) + " and continue to Level " + nextLevel.group(3);
        }
        var complete = java.util.regex.Pattern.compile("workflow\\.approve(Investment|Risk)Level(\\d)Complete").matcher(actionId);
        if (complete.matches()) {
            return "Approve as " + complete.group(1) + " Level " + complete.group(2);
        }
        return actionId;
    }

}
