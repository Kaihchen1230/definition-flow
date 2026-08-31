package com.example.approvalpoc.requestcase;

import com.example.approvalpoc.audit.AuditService;
import com.example.approvalpoc.definition.DefinitionModuleType;
import com.example.approvalpoc.definition.DefinitionService;
import com.example.approvalpoc.dev.DemoUserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestCaseCreationService {
    private final RequestCaseRepository requestCaseRepository;
    private final DemoUserRepository userRepository;
    private final DefinitionService definitionService;
    private final AuditService auditService;

    public RequestCaseCreationService(
            RequestCaseRepository requestCaseRepository,
            DemoUserRepository userRepository,
            DefinitionService definitionService,
            AuditService auditService
    ) {
        this.requestCaseRepository = requestCaseRepository;
        this.userRepository = userRepository;
        this.definitionService = definitionService;
        this.auditService = auditService;
    }

    @Transactional
    public RequestCaseEntity createEmpty(String requestType, String userId, String frontendRuleCatalogVersion) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown user: " + userId));
        JsonNode workflowDefinition = definitionService.activeDefinition(requestType, DefinitionModuleType.WORKFLOW);
        String initialState = workflowDefinition.path("workflow").path("initialState").asText();
        if (initialState.isBlank()) {
            throw new IllegalStateException("Workflow initialState is required for request type: " + requestType);
        }

        Instant now = Instant.now();
        RequestCaseEntity requestCase = requestCaseRepository.save(new RequestCaseEntity(
                UUID.randomUUID(),
                requestType,
                initialState,
                user.getId(),
                user.getId(),
                "{}",
                now,
                now
        ));
        auditService.record(
                requestCase.getId(),
                "CREATE_REQUEST",
                user.getId(),
                null,
                initialState,
                definitionService.activeVersions(requestType),
                Map.of("requestType", requestType, "frontendRuleCatalogVersion", frontendRuleCatalogVersion)
        );
        return requestCase;
    }
}
