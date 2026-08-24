package com.example.approvalpoc.audit;

import com.example.approvalpoc.definition.DefinitionModuleType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditEventRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public void record(UUID requestCaseId, String eventType, String actorId, String fromState, String toState, Map<DefinitionModuleType, Integer> versions, Object details) {
        repository.save(new AuditEventEntity(
                requestCaseId,
                eventType,
                actorId,
                fromState,
                toState,
                writeJson(versions),
                writeJson(details),
                Instant.now()
        ));
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write audit JSON", e);
        }
    }
}

