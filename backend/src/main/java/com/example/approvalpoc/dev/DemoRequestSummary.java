package com.example.approvalpoc.dev;

public record DemoRequestSummary(
        String id,
        String label,
        String scenario,
        String companyName,
        String workflowState
) {
}
