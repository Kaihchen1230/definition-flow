package com.example.approvalpoc.requestcase;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "request_case")
public class RequestCaseEntity {
    @Id
    private UUID id;
    private String requestType;
    private String workflowState;
    private String createdBy;
    private String assignedTo;
    private String requestData;
    private Instant createdAt;
    private Instant updatedAt;

    protected RequestCaseEntity() {
    }

    public RequestCaseEntity(UUID id, String requestType, String workflowState, String createdBy, String assignedTo, String requestData, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.requestType = requestType;
        this.workflowState = workflowState;
        this.createdBy = createdBy;
        this.assignedTo = assignedTo;
        this.requestData = requestData;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public String getRequestType() {
        return requestType;
    }

    public String getWorkflowState() {
        return workflowState;
    }

    public void setWorkflowState(String workflowState) {
        this.workflowState = workflowState;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public String getRequestData() {
        return requestData;
    }

    public void setRequestData(String requestData) {
        this.requestData = requestData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }
}

