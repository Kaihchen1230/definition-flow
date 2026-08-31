package com.example.approvalpoc.requestcase.api;

import com.example.approvalpoc.actions.ActionResult;
import com.example.approvalpoc.actions.ActionService;
import com.example.approvalpoc.actions.RequestDataPatch;
import com.example.approvalpoc.requestcase.RequestCaseCreationService;
import com.example.approvalpoc.requestcase.evaluation.RequestEvaluationService;
import com.example.approvalpoc.runtime.EvaluationContextService;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/request-cases")
public class RequestCaseApiController {
    private static final String FRONTEND_RULE_CATALOG_VERSION_HEADER = "X-Frontend-Rule-Catalog-Version";
    private final EvaluationContextService contextService;
    private final RequestEvaluationService requestEvaluationService;
    private final ActionService actionService;
    private final RequestCaseCreationService requestCaseCreationService;

    public RequestCaseApiController(
            EvaluationContextService contextService,
            RequestEvaluationService requestEvaluationService,
            ActionService actionService,
            RequestCaseCreationService requestCaseCreationService
    ) {
        this.contextService = contextService;
        this.requestEvaluationService = requestEvaluationService;
        this.actionService = actionService;
        this.requestCaseCreationService = requestCaseCreationService;
    }

    @PostMapping
    public CreateRequestCaseResponse createRequestCase(
            @RequestParam String userId,
            @RequestHeader(name = FRONTEND_RULE_CATALOG_VERSION_HEADER, defaultValue = "unknown") String frontendRuleCatalogVersion,
            @RequestBody CreateRequestCaseRequest request
    ) {
        var requestCase = requestCaseCreationService.createEmpty(request.requestType(), userId, frontendRuleCatalogVersion);
        return new CreateRequestCaseResponse(
                requestCase.getId().toString(),
                requestCase.getRequestType(),
                requestCase.getWorkflowState()
        );
    }

    @GetMapping("/{requestCaseId}/evaluation-context")
    public ObjectNode evaluationContext(@PathVariable UUID requestCaseId, @RequestParam String userId) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, userId, "render");
        return requestEvaluationService.evaluate(bundle);
    }

    @PatchMapping("/{requestCaseId}/request-data")
    public ActionResult patchRequestData(
            @PathVariable UUID requestCaseId,
            @RequestParam String userId,
            @RequestHeader(name = FRONTEND_RULE_CATALOG_VERSION_HEADER, defaultValue = "unknown") String frontendRuleCatalogVersion,
            @RequestBody RequestDataPatch patch
    ) {
        return actionService.patchRequestData(requestCaseId, userId, patch, frontendRuleCatalogVersion);
    }

    @PostMapping("/{requestCaseId}/actions/{actionId}")
    public ActionResult executeAction(
            @PathVariable UUID requestCaseId,
            @PathVariable String actionId,
            @RequestParam String userId,
            @RequestHeader(name = FRONTEND_RULE_CATALOG_VERSION_HEADER, defaultValue = "unknown") String frontendRuleCatalogVersion,
            @RequestBody(required = false) JsonNode payload
    ) {
        return actionService.execute(requestCaseId, userId, actionId, payload, frontendRuleCatalogVersion);
    }
}
