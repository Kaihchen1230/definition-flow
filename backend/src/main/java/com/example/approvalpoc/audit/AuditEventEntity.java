package com.example.approvalpoc.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_event")
public class AuditEventEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private UUID requestCaseId;
    private String eventType;
    private String actorId;
    private String fromWorkflowState;
    private String toWorkflowState;
    private String definitionVersions;
    private String detailsJson;
    private Instant createdAt;

    protected AuditEventEntity() {
    }

    public AuditEventEntity(UUID requestCaseId, String eventType, String actorId, String fromWorkflowState, String toWorkflowState, String definitionVersions, String detailsJson, Instant createdAt) {
        this.requestCaseId = requestCaseId;
        this.eventType = eventType;
        this.actorId = actorId;
        this.fromWorkflowState = fromWorkflowState;
        this.toWorkflowState = toWorkflowState;
        this.definitionVersions = definitionVersions;
        this.detailsJson = detailsJson;
        this.createdAt = createdAt;
    }
}

