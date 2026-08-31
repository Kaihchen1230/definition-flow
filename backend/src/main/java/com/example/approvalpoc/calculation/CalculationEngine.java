package com.example.approvalpoc.calculation;

import com.fasterxml.jackson.databind.JsonNode;

public interface CalculationEngine {
    String currentRuleSetVersion(
            String requestType,
            String calculationId,
            JsonNode calculationDefinition
    );

    CalculationEngineResult calculate(
            String requestType,
            String calculationId,
            JsonNode calculationDefinition,
            JsonNode context
    );
}
