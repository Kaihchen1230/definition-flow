package com.example.approvalpoc.calculation;

import com.fasterxml.jackson.databind.JsonNode;

public record CalculationEngineResult(
        JsonNode result,
        String engineId,
        String ruleSetVersion
) {
}
