package com.example.approvalpoc.validation;

import java.util.List;

public record ValidationIssue(
        String ruleId,
        String severity,
        List<String> scope,
        String pageId,
        String sectionId,
        String nodeId,
        String path,
        String message
) {
}

