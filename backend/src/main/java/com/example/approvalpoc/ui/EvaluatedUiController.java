package com.example.approvalpoc.ui;

import com.example.approvalpoc.actions.ActionResult;
import com.example.approvalpoc.actions.ActionService;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.example.approvalpoc.runtime.EvaluationContextService;
import com.example.approvalpoc.runtime.RuntimeBundle;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/request-cases")
public class EvaluatedUiController {
    private final RequestCaseRepository requestCaseRepository;
    private final EvaluationContextService contextService;
    private final UiEvaluationService uiEvaluationService;
    private final ActionService actionService;

    public EvaluatedUiController(
            RequestCaseRepository requestCaseRepository,
            EvaluationContextService contextService,
            UiEvaluationService uiEvaluationService,
            ActionService actionService
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.contextService = contextService;
        this.uiEvaluationService = uiEvaluationService;
        this.actionService = actionService;
    }

    @GetMapping
    public List<RequestCaseEntity> requestCases() {
        return requestCaseRepository.findAll();
    }

    @GetMapping("/{requestCaseId}/evaluated-ui")
    public ObjectNode evaluatedUi(@PathVariable UUID requestCaseId, @RequestParam(defaultValue = "analyst") String actorId) {
        RuntimeBundle bundle = contextService.bundle(requestCaseId, actorId, "render");
        return uiEvaluationService.evaluate(bundle);
    }

    @PutMapping("/{requestCaseId}/request-data")
    public ActionResult saveRequestData(@PathVariable UUID requestCaseId, @RequestParam(defaultValue = "analyst") String actorId, @RequestBody JsonNode requestData) {
        return actionService.saveRequestData(requestCaseId, actorId, requestData);
    }

    @PostMapping("/{requestCaseId}/actions/{actionId}")
    public ActionResult executeAction(@PathVariable UUID requestCaseId, @PathVariable String actionId, @RequestParam(defaultValue = "analyst") String actorId, @RequestBody(required = false) JsonNode payload) {
        return actionService.execute(requestCaseId, actorId, actionId, payload);
    }
}
