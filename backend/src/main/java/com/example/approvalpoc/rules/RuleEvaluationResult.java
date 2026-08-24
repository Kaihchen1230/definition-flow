package com.example.approvalpoc.rules;

import java.util.List;

public record RuleEvaluationResult(boolean result, List<RuleTraceEntry> trace) {
}

