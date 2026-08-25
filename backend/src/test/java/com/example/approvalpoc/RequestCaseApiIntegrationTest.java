package com.example.approvalpoc;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class RequestCaseApiIntegrationTest {
    private static final String DEMO_REQUEST_ID = "11111111-1111-1111-1111-111111111111";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUpDemoData() throws Exception {
        mockMvc.perform(post("/api/dev/definitions/reload/startup-investment"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/dev/demo/reset"))
                .andExpect(status().isOk());
    }

    @Test
    void submitInvestmentReviewRequiresFreshApprovalRoute() throws Exception {
        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitInvestmentReview", DEMO_REQUEST_ID)
                        .param("actorId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Blocking validations must be resolved."))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("approvalRouteMustBeFresh")));
    }

    @Test
    void supportActorCannotSaveRequestData() throws Exception {
        String evaluationContext = mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("actorId", "support"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode requestData = objectMapper.readTree(evaluationContext).path("requestData").deepCopy();
        ((ObjectNode) requestData.path("company")).put("name", "Support Edit Attempt");

        mockMvc.perform(put("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("actorId", "support")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Save is not allowed for this actor or workflow state."));

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("actorId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.company.name").value("Acme Robotics"));
    }

    @Test
    void evaluationContextReturnsRuleResultsWithoutBackendOwnedPages() throws Exception {
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("actorId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages").doesNotExist())
                .andExpect(jsonPath("$.definitionVersions.UI").doesNotExist())
                .andExpect(jsonPath("$.ruleResults.canEditInvestmentReview.result").value(true))
                .andExpect(jsonPath("$.ruleResults.showEnhancedRiskReview.result").value(true));
    }

    @Test
    void legacyEvaluatedUiEndpointStillReturnsEvaluationContext() throws Exception {
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluated-ui", DEMO_REQUEST_ID)
                        .param("actorId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages").doesNotExist())
                .andExpect(jsonPath("$.ruleResults.canEditInvestmentReview.result").value(true));
    }

    @Test
    void pageScopedPatchUpdatesOnlySubmittedPaths() throws Exception {
        ObjectNode patchBody = objectMapper.createObjectNode();
        ArrayNode updates = patchBody.putArray("updates");
        updates.addObject()
                .put("path", "company.name")
                .put("value", "Patched Robotics");

        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("actorId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.details.paths[0]").value("company.name"));

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("actorId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.company.name").value("Patched Robotics"))
                .andExpect(jsonPath("$.requestData.investment.amount").value(6500000));
    }
}
