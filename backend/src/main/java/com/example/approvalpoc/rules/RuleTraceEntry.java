package com.example.approvalpoc.rules;

public record RuleTraceEntry(
        String ruleRef,
        String path,
        String op,
        Object expected,
        Object actual,
        boolean result,
        String status
) {
}
