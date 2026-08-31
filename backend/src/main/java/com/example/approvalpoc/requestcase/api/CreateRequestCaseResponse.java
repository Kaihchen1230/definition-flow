package com.example.approvalpoc.requestcase.api;

public record CreateRequestCaseResponse(
        String id,
        String requestType,
        String workflowState
) {
}
