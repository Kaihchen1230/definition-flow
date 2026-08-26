package com.example.approvalpoc;

import com.example.approvalpoc.dev.DemoDataService;
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
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Blocking validations must be resolved."))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("approvalRouteMustBeFresh")));
    }

    @Test
    void submitInvestmentReviewRequiresCoreFieldsAndCompleteFounderDetails() throws Exception {
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

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/calculateApprovalRoute", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitInvestmentReview", DEMO_REQUEST_ID)
                        .param("userId", "analyst")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("companyNameRequired")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("founderDetailsRequired")));
    }

    @Test
    void riskInputsInvalidateRouteAndMustBeCompletedBeforeFinalApproval() throws Exception {
        performSuccessfulAction("analyst", "calculateApprovalRoute");
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calculations.approvalRoute.result.routeType").value("ENHANCED_RISK_CHAIN"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.requiredLevels[0]").value("INVESTMENT_APPROVER"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.requiredLevels[1]").value("RISK_OFFICER"))
                .andExpect(jsonPath("$.ruleResults.canSubmitToInvestmentApprover.result").value(true));
        performSuccessfulAction("analyst", "workflow.submitInvestmentReview");
        performSuccessfulAction("investment-approver", "workflow.approveInvestmentReview");

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitRiskReview", DEMO_REQUEST_ID)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("analystExceptionsNeedRiskConfirmation")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("enhancedRiskNarrativeRequired")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("riskRecommendationRequired")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("companyProfileRiskConfirmed")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("investmentTermsRiskConfirmed")))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("foundersOwnershipRiskConfirmed")));

        ObjectNode referBackPatch = objectMapper.createObjectNode();
        referBackPatch.putArray("updates")
                .addObject()
                .put("path", "risk.pageConfirmations.companyProfile")
                .put("value", "REFER_BACK");
        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", DEMO_REQUEST_ID)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(referBackPatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitRiskReview", DEMO_REQUEST_ID)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("companyProfileRiskNoteRequired")));

        ObjectNode riskPatch = objectMapper.createObjectNode();
        ArrayNode updates = riskPatch.putArray("updates");
        updates.addObject().put("path", "risk.enhancedReviewNarrative").put("value", "Material exception reviewed and mitigated.");
        updates.addObject().put("path", "risk.recommendation").put("value", "APPROVE");
        updates.addObject().put("path", "risk.pageConfirmations.companyProfile").put("value", "CONFIRMED");
        updates.addObject().put("path", "risk.pageConfirmations.investmentTerms").put("value", "CONFIRMED");
        updates.addObject().put("path", "risk.pageConfirmations.foundersOwnership").put("value", "CONFIRMED");
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

        mockMvc.perform(post("/api/request-cases/{requestCaseId}/actions/workflow.submitRiskReview", DEMO_REQUEST_ID)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.details.issues[*].ruleId", hasItem("approvalRouteMustBeFresh")));

        performSuccessfulAction("risk-officer", "calculateApprovalRoute");
        performSuccessfulAction("risk-officer", "workflow.submitRiskReview");
        performSuccessfulAction("risk-approver", "workflow.approveFinalRequest");

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "risk-approver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflowState").value("APPROVED"));
    }

    @Test
    void standardRequestCompletesTheFullApprovalChain() throws Exception {
        String standardRequestId = DemoDataService.STANDARD_REQUEST_ID.toString();

        performSuccessfulAction(standardRequestId, "analyst", "calculateApprovalRoute");
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", standardRequestId)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.derived.investmentVariant").value("STANDARD"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.routeType").value("STANDARD_APPROVAL_CHAIN"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.requiredLevels[0]").value("INVESTMENT_APPROVER"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.requiredLevels[1]").value("RISK_OFFICER"))
                .andExpect(jsonPath("$.calculations.approvalRoute.result.requiredLevels[2]").value("RISK_APPROVER"))
                .andExpect(jsonPath("$.ruleResults.canSubmitToInvestmentApprover.result").value(true));

        performSuccessfulAction(standardRequestId, "analyst", "workflow.submitInvestmentReview");
        performSuccessfulAction(standardRequestId, "investment-approver", "workflow.approveInvestmentReview");

        ObjectNode confirmationsPatch = objectMapper.createObjectNode();
        ArrayNode confirmationUpdates = confirmationsPatch.putArray("updates");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.companyProfile").put("value", "CONFIRMED");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.investmentTerms").put("value", "CONFIRMED");
        confirmationUpdates.addObject().put("path", "risk.pageConfirmations.foundersOwnership").put("value", "CONFIRMED");
        mockMvc.perform(patch("/api/request-cases/{requestCaseId}/request-data", standardRequestId)
                        .param("userId", "risk-officer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmationsPatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        performSuccessfulAction(standardRequestId, "risk-officer", "workflow.submitRiskReview");
        performSuccessfulAction(standardRequestId, "risk-approver", "workflow.approveFinalRequest");

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", standardRequestId)
                        .param("userId", "risk-approver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workflowState").value("APPROVED"));
    }

    @Test
    void demoRequestCatalogContainsThreeRoutingScenarios() throws Exception {
        mockMvc.perform(get("/api/dev/demo/requests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[*].id", hasItem(DEMO_REQUEST_ID)))
                .andExpect(jsonPath("$[*].id", hasItem(DemoDataService.STANDARD_REQUEST_ID.toString())))
                .andExpect(jsonPath("$[*].id", hasItem(DemoDataService.MATERIAL_EXCEPTION_REQUEST_ID.toString())));
    }

    @Test
    void supportUserCannotPatchRequestData() throws Exception {
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
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Save is not allowed for this user or workflow state."));

        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestData.company.name").value("Acme Robotics"));
    }

    @Test
    void evaluationContextReturnsRuleResultsWithoutBackendOwnedPages() throws Exception {
        mockMvc.perform(get("/api/request-cases/{requestCaseId}/evaluation-context", DEMO_REQUEST_ID)
                        .param("userId", "analyst"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages").doesNotExist())
                .andExpect(jsonPath("$.definitionVersions.UI").doesNotExist())
                .andExpect(jsonPath("$.ruleResults.canEditInvestmentReview.result").value(true))
                .andExpect(jsonPath("$.ruleResults.showEnhancedRiskReview.result").value(false))
                .andExpect(jsonPath("$.ruleResults.showRiskOfficerConfirmations.result").value(false));
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
