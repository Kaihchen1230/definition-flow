package com.example.approvalpoc.calculation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LocalPocCalculationEngineTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final LocalPocCalculationEngine engine = new LocalPocCalculationEngine(objectMapper);

    @Test
    void highSeverityExceptionUsesTheEnhancedRiskRoute() throws Exception {
        var definition = objectMapper.readTree("""
                {"engine":"local-poc","ruleSetVersion":"v1"}
                """);
        var context = objectMapper.readTree("""
                {
                  "requestData": {
                    "company": {"stage":"GROWTH"},
                    "investment": {"amount":1000000},
                    "risk": {"hasMaterialException":false},
                    "exceptions": [{"severity":"HIGH"}]
                  }
                }
                """);

        var result = engine.calculate("startupInvestment", "approvalRoute", definition, context).result();

        assertThat(result.path("variantUsed").asText()).isEqualTo("HIGH_RISK");
        assertThat(result.path("routeType").asText()).isEqualTo("ENHANCED_RISK_CHAIN");
        assertThat(result.path("routingReason").asText()).isEqualTo("Request has a high-severity exception.");
    }
}
