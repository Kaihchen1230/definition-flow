package com.example.approvalpoc;

import com.example.approvalpoc.dev.DemoDataService;
import com.example.approvalpoc.dev.DemoUserEntity;
import com.example.approvalpoc.dev.DemoUserRepository;
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
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Autowired
    private DemoDataService demoDataService;

    @Autowired
    private DemoUserRepository demoUserRepository;

    @BeforeEach
    void setUpDemoData() throws Exception {
        mockMvc.perform(post("/api/dev/definitions/reload/startup-investment"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/dev/demo/reset"))
                .andExpect(status().isOk());
    }

    @Test
    void demoResetLoadsTheCompleteUserCatalog() throws Exception {
        mockMvc.perform(get("/api/dev/demo/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)))
                .andExpect(jsonPath("$[0].id").value("analyst"))
                .andExpect(jsonPath("$[0].entitlements", hasSize(2)))
                .andExpect(jsonPath("$[1].id").value("investment-approver-l1"))
                .andExpect(jsonPath("$[1].entitlements", hasSize(1)))
                .andExpect(jsonPath("$[3].entitlements", hasItem("DECLINE_REQUEST")))
                .andExpect(jsonPath("$[4].entitlements", hasItem("WITHDRAW_REQUEST")))
                .andExpect(jsonPath("$[8].entitlements", hasItem("DECLINE_REQUEST")))
                .andExpect(jsonPath("$[*].id", hasItem("investment-approver-l3")))
                .andExpect(jsonPath("$[*].id", hasItem("risk-approver-l4")));
    }

    @Test
    void startupUserSyncPreservesUnrelatedUsersAndRemovesKnownLegacyUsers() {
        demoUserRepository.save(new DemoUserEntity("custom-user", "Custom User", "Support", "[]", "[]"));
        demoUserRepository.save(new DemoUserEntity("investment-approver", "Legacy Approver", "InvestmentAnalyst", "[]", "[]"));

        demoDataService.syncUsers();

        assertTrue(demoUserRepository.existsById("custom-user"));
        assertFalse(demoUserRepository.existsById("investment-approver"));
        assertTrue(demoUserRepository.existsById("investment-approver-l3"));
        assertTrue(demoUserRepository.existsById("risk-approver-l4"));
    }

    @Test
    void requestStartsAtTheLowestSelectedInvestmentApprovalTier() throws Exception {
        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitInvestmentReviewLevel1", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.details.to").value("PENDING_INVESTMENT_APPROVAL_LEVEL_1"));
    }

    @Test
    void backendTrustsFrontendForFieldValidation() throws Exception {
        ObjectNode patchBody = objectMapper.createObjectNode();
        ArrayNode updates = patchBody.putArray("updates");
        updates.addObject().put("path", "company.name").put("value", "");
        ArrayNode founders = objectMapper.createArrayNode();
        founders.addObject()
                .put("name", "")
                .put("title", "CEO")
                .put("ownershipPercent", 42)
                .put("backgroundCheck", "YES");
        updates.addObject().put("path", "founders").set("value", founders);

        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitInvestmentReviewLevel1", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.details.to").value("PENDING_INVESTMENT_APPROVAL_LEVEL_1"));
    }

    @Test
    void highValueRequestCompletesNonContiguousMultiLevelApprovalSequences() throws Exception {
        performSuccessfulAction("analyst", "workflow.submitInvestmentReviewLevel1");
        performSuccessfulAction("investment-approver-l1", "workflow.approveInvestmentLevel1ToLevel3");
        performSuccessfulAction("investment-approver-l3", "workflow.approveInvestmentLevel3Complete");

        ObjectNode riskPatch = objectMapper.createObjectNode();
        ArrayNode updates = riskPatch.putArray("updates");
        updates.addObject().put("path", "risk.enhancedReviewNarrative").put("value", "Material exception reviewed and mitigated.");
        updates.addObject().put("path", "risk.recommendation").put("value", "APPROVE");
        updates.addObject().put("path", "risk.pageConfirmations.companyProfile").put("value", "CONFIRMED");
        updates.addObject().put("path", "risk.pageConfirmations.investmentTerms").put("value", "CONFIRMED");
        updates.addObject().put("path", "risk.pageConfirmations.foundersOwnership").put("value", "CONFIRMED");
        ObjectNode riskLevelsUpdate = updates.addObject();
        riskLevelsUpdate.put("path", "approvalRequirements.riskLevels");
        riskLevelsUpdate.set("value", objectMapper.valueToTree(java.util.List.of("LEVEL_1", "LEVEL_4")));
        ArrayNode exceptions = objectMapper.createArrayNode();
        exceptions.addObject()
                .put("id", "ex-1")
                .put("description", "Customer concentration above policy threshold.")
                .put("severity", "HIGH")
                .putObject("createdBy")
                .put("userId", "analyst")
                .put("role", "InvestmentAnalyst");
        ((ObjectNode) exceptions.get(0)).put("riskConfirmation", "CONFIRMED");
        updates.addObject().put("path", "exceptions").set("value", exceptions);

        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(riskPatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        performSuccessfulAction("risk-officer", "workflow.submitRiskReviewLevel1");
        performSuccessfulAction("risk-approver-l1", "workflow.approveRiskLevel1ToLevel4");
        performSuccessfulAction("risk-approver-l4", "workflow.approveRiskLevel4Complete");

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "risk-approver-l4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflowState").value("APPROVED"));
    }

    @Test
    void standardRequestCompletesTheFullApprovalChain() throws Exception {
        String standardRequestId = DemoDataService.STANDARD_REQUEST_ID.toString();

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", standardRequestId)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.approvalRequirements.investmentLevels[0]").value("LEVEL_1"))
                .andExpect(jsonPath("$.requestData.approvalRequirements.riskLevels").isEmpty());

        performSuccessfulAction(standardRequestId, "analyst", "workflow.submitInvestmentReviewLevel1");
        performSuccessfulAction(standardRequestId, "investment-approver-l1", "workflow.approveInvestmentLevel1Complete");

        ObjectNode confirmationsPatch = objectMapper.createObjectNode();
        ArrayNode confirmationUpdates = confirmationsPatch.putArray("updates");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.companyProfile").put("value", "CONFIRMED");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.investmentTerms").put("value", "CONFIRMED");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.foundersOwnership").put("value", "CONFIRMED");
        ObjectNode riskLevelsUpdate = confirmationUpdates.addObject();
        riskLevelsUpdate.put("path", "approvalRequirements.riskLevels");
        riskLevelsUpdate.set("value", objectMapper.valueToTree(java.util.List.of("LEVEL_1")));
        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", standardRequestId)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmationsPatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        performSuccessfulAction(standardRequestId, "risk-officer", "workflow.submitRiskReviewLevel1");
        performSuccessfulAction(standardRequestId, "risk-approver-l1", "workflow.approveRiskLevel1Complete");

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", standardRequestId)
                        .param("userId", "risk-approver-l1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflowState").value("APPROVED"));
    }

    @Test
    void demoRequestCatalogContainsThreeManualApprovalScenarios() throws Exception {
        mockMvc.perform(get("/api/dev/demo/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[*].id", hasItem(DEMO_REQUEST_ID)))
                .andExpect(jsonPath("$[*].id", hasItem(DemoDataService.STANDARD_REQUEST_ID.toString())))
                .andExpect(jsonPath("$[*].id", hasItem(DemoDataService.MATERIAL_EXCEPTION_REQUEST_ID.toString())));
    }

    @Test
    void createsARequestWithEmptyPageDataInTheWorkflowInitialState() throws Exception {
        String response = mockMvc.perform(post("/api/request-cases")
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"requestType\":\"startupInvestment\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestType").value("startupInvestment"))
                .andExpect(jsonPath("$.workflowState").value("DRAFT"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String requestCaseId = objectMapper.readTree(response).path("id").asText();
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", requestCaseId)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData").isEmpty())
                .andExpect(jsonPath("$.workflowState").value("DRAFT"))
                .andExpect(jsonPath("$.workflowActions[0].id").value("workflow.startInvestmentReview"));

        mockMvc.perform(get("/api/dev/demo/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[*].id", hasItem(requestCaseId)))
                .andExpect(jsonPath("$[*].label", hasItem("Untitled request")));
    }

    @Test
    void backendAcceptsPatchBecauseFrontendOwnsEditPermissions() throws Exception {
        ObjectNode patchBody = objectMapper.createObjectNode();
        ArrayNode updates = patchBody.putArray("updates");
        updates.addObject()
                .put("path", "company.name")
                .put("value", "Support Edit Attempt");

        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("userId", "support")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.company.name").value("Support Edit Attempt"));
    }

    @Test
    void evaluationContextReturnsRawDataAndWorkflowRuleReferences() throws Exception {
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages").doesNotExist())
                .andExpect(jsonPath("$.definitionVersions.UI").doesNotExist())
                .andExpect(jsonPath("$.ruleResults").doesNotExist())
                .andExpect(jsonPath("$.validation").doesNotExist())
                .andExpect(jsonPath("$.canSave").doesNotExist())
                .andExpect(jsonPath("$.derived").doesNotExist())
                .andExpect(jsonPath("$.workflowActions[0].id").value("workflow.submitInvestmentReviewLevel1"))
                .andExpect(jsonPath("$.workflowActions[1].id").value("workflow.submitInvestmentReviewLevel2"))
                .andExpect(jsonPath("$.workflowActions[2].id").value("workflow.submitInvestmentReviewLevel3"))
                .andExpect(jsonPath("$.workflowActions[0].enabledRule").doesNotExist());
    }

    @Test
    void legacyEvaluatedUiEndpointIsNotSupported() throws Exception {
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluated-ui", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isNotFound());
    }

    @Test
    void pageScopedPatchUpdatesOnlySubmittedPaths() throws Exception {
        ObjectNode patchBody = objectMapper.createObjectNode();
        ArrayNode updates = patchBody.putArray("updates");
        updates.addObject()
                .put("path", "company.name")
                .put("value", "Patched Robotics");

        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(patchBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.details.paths[0]").value("company.name"));

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.company.name").value("Patched Robotics"))
                .andExpect(jsonPath("$.requestData.investment.amount").value(6500000));
    }

    private void performSuccessfulAction(String userId, String actionId) throws Exception {
        performSuccessfulAction(DEMO_REQUEST_ID, userId, actionId);
    }

    private void performSuccessfulAction(String requestCaseId, String userId, String actionId) throws Exception {
        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/{actionId}", requestCaseId, actionId)
                        .param("userId", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
