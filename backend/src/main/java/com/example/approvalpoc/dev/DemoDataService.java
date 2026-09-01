package com.example.approvalpoc.dev;

import com.example.approvalpoc.audit.AuditEventRepository;
import com.example.approvalpoc.calculation.CalculationResultRepository;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoDataService {
    public static final UUID DEMO_REQUEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    public static final UUID STANDARD_REQUEST_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    public static final UUID MATERIAL_EXCEPTION_REQUEST_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final List<UUID> DEMO_REQUEST_IDS = List.of(DEMO_REQUEST_ID, STANDARD_REQUEST_ID, MATERIAL_EXCEPTION_REQUEST_ID);
    private static final List<String> LEGACY_DEMO_USER_IDS = List.of("investment-approver", "risk-approver");
    private static final List<String> DEMO_USER_IDS = List.of(
            "analyst",
            "investment-approver-l1",
            "investment-approver-l2",
            "investment-approver-l3",
            "risk-officer",
            "risk-approver-l1",
            "risk-approver-l2",
            "risk-approver-l3",
            "risk-approver-l4",
            "support"
    );
    private final DemoUserRepository userRepository;
    private final RequestCaseRepository requestCaseRepository;
    private final CalculationResultRepository calculationResultRepository;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public DemoDataService(
            DemoUserRepository userRepository,
            RequestCaseRepository requestCaseRepository,
            CalculationResultRepository calculationResultRepository,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.requestCaseRepository = requestCaseRepository;
        this.calculationResultRepository = calculationResultRepository;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public Map<String, Object> reset() {
        auditEventRepository.deleteAll();
        calculationResultRepository.deleteAll();
        requestCaseRepository.deleteAll();
        userRepository.deleteAll();

        seedUsers();
        seedRequest(DEMO_REQUEST_ID, seedHighValueRequest());
        seedRequest(STANDARD_REQUEST_ID, seedStandardRequest());
        seedRequest(MATERIAL_EXCEPTION_REQUEST_ID, seedMaterialExceptionRequest());

        return Map.of(
                "requestCaseId", DEMO_REQUEST_ID.toString(),
                "requestCaseIds", DEMO_REQUEST_IDS.stream().map(UUID::toString).toList(),
                "requests", DEMO_REQUEST_IDS.size(),
                "users", userRepository.findAll().size()
        );
    }

    @Transactional
    public int syncUsers() {
        userRepository.deleteAllById(LEGACY_DEMO_USER_IDS);
        seedUsers();
        return DEMO_USER_IDS.size();
    }

    public List<DemoUserSummary> users() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparingInt((DemoUserEntity user) -> userOrder(user.getId()))
                        .thenComparing(DemoUserEntity::getDisplayName))
                .map(user -> new DemoUserSummary(
                        user.getId(),
                        user.getDisplayName(),
                        user.getRole(),
                        readStringList(user.getEntitlements())
                ))
                .toList();
    }

    public List<DemoRequestSummary> requests() {
        return requestCaseRepository.findAll().stream()
                .sorted((left, right) -> left.getCreatedAt().compareTo(right.getCreatedAt()))
                .map(this::summary)
                .toList();
    }

    private DemoRequestSummary summary(RequestCaseEntity requestCase) {
        JsonNode requestData = readJson(requestCase.getRequestData());
        String companyName = requestData.path("company").path("name").asText();
        String label = requestData.path("demo").path("label").asText();
        return new DemoRequestSummary(
                requestCase.getId().toString(),
                label.isBlank() ? (companyName.isBlank() ? "Untitled request" : companyName) : label,
                requestData.path("demo").path("scenario").asText("New empty request"),
                companyName,
                requestCase.getWorkflowState()
        );
    }

    private void seedRequest(UUID id, Map<String, Object> requestData) {
        Instant now = Instant.now();
        requestCaseRepository.save(new RequestCaseEntity(
                id,
                "startupInvestment",
                "INVESTMENT_REVIEW",
                "analyst",
                "analyst",
                writeJson(requestData),
                now,
                now
        ));
    }

    private void seedUsers() {
        userRepository.save(new DemoUserEntity(
                "analyst",
                "Avery Analyst",
                "InvestmentAnalyst",
                writeJson(List.of("EDIT_INVESTMENT_REQUEST", "WITHDRAW_REQUEST")),
                writeJson(List.of("InvestmentTeam"))
        ));
        seedApprover("investment-approver-l1", "Iris Investment Approver · L1", "InvestmentAnalyst", "APPROVE_INVESTMENT_LEVEL_1", "InvestmentTeam", false);
        seedApprover("investment-approver-l2", "Imani Investment Approver · L2", "InvestmentAnalyst", "APPROVE_INVESTMENT_LEVEL_2", "InvestmentTeam", false);
        seedApprover("investment-approver-l3", "Ivan Investment Approver · L3", "InvestmentAnalyst", "APPROVE_INVESTMENT_LEVEL_3", "InvestmentTeam", true);
        userRepository.save(new DemoUserEntity(
                "risk-officer",
                "Riley Risk Officer",
                "RiskOfficer",
                writeJson(List.of("EDIT_RISK_REVIEW", "WITHDRAW_REQUEST")),
                writeJson(List.of("RiskTeam"))
        ));
        seedApprover("risk-approver-l1", "Reese Risk Approver · L1", "RiskOfficer", "APPROVE_RISK_LEVEL_1", "RiskTeam", false);
        seedApprover("risk-approver-l2", "Rina Risk Approver · L2", "RiskOfficer", "APPROVE_RISK_LEVEL_2", "RiskTeam", false);
        seedApprover("risk-approver-l3", "Rafael Risk Approver · L3", "RiskOfficer", "APPROVE_RISK_LEVEL_3", "RiskTeam", false);
        seedApprover("risk-approver-l4", "Rowan Risk Approver · L4", "RiskOfficer", "APPROVE_RISK_LEVEL_4", "RiskTeam", true);
        userRepository.save(new DemoUserEntity(
                "support",
                "Sam Support Viewer",
                "Support",
                writeJson(List.of("VIEW_REQUEST")),
                writeJson(List.of("Support"))
        ));
    }

    private void seedApprover(String id, String displayName, String role, String entitlement, String team, boolean canDecline) {
        userRepository.save(new DemoUserEntity(
                id,
                displayName,
                role,
                writeJson(canDecline ? List.of(entitlement, "DECLINE_REQUEST") : List.of(entitlement)),
                writeJson(List.of(team))
        ));
    }

    private int userOrder(String userId) {
        int index = DEMO_USER_IDS.indexOf(userId);
        return index >= 0 ? index : DEMO_USER_IDS.size();
    }

    private Map<String, Object> seedHighValueRequest() {
        return seedRequestData(
                "High value / early stage",
                "Full chain with enhanced risk controls: amount ≥ $5M and Seed stage",
                "Acme Robotics",
                "SEED",
                "AI",
                6_500_000,
                "SAFE",
                "Expand compute infrastructure and hire go-to-market team.",
                List.of(
                        Map.of("name", "Mina Chen", "title", "CEO", "ownershipPercent", 42, "backgroundCheck", "YES"),
                        Map.of("name", "Leo Park", "title", "CTO", "ownershipPercent", 38, "backgroundCheck", "YES")
                ),
                List.of(Map.of(
                        "id", "ex-1",
                        "description", "Customer concentration above policy threshold.",
                        "severity", "HIGH",
                        "createdBy", Map.of("userId", "analyst", "role", "InvestmentAnalyst"),
                        "riskConfirmation", ""
                )),
                List.of("HIGH_BURN_RATE", "DATA_PRIVACY_EXPOSURE"),
                false,
                List.of("LEVEL_1", "LEVEL_3"),
                List.of()
        );
    }

    private Map<String, Object> seedStandardRequest() {
        return seedRequestData(
                "Standard growth investment",
                "Standard full chain: Growth stage, below $5M, no material exception",
                "Harbor Health",
                "GROWTH",
                "HEALTHCARE",
                1_500_000,
                "EQUITY",
                "Expand clinical partnerships and customer success.",
                List.of(Map.of("name", "Nora Singh", "title", "CEO", "ownershipPercent", 64, "backgroundCheck", "YES")),
                List.of(),
                List.of(),
                false,
                List.of("LEVEL_1"),
                List.of()
        );
    }

    private Map<String, Object> seedMaterialExceptionRequest() {
        return seedRequestData(
                "Material exception",
                "Full chain with enhanced risk controls: material exception",
                "Nova Ledger",
                "GROWTH",
                "FINTECH",
                2_250_000,
                "CONVERTIBLE_NOTE",
                "Complete compliance program and expand the engineering team.",
                List.of(Map.of("name", "Elena Cruz", "title", "Founder", "ownershipPercent", 72, "backgroundCheck", "YES")),
                List.of(Map.of(
                        "id", "ex-3",
                        "description", "Pending remediation of a material compliance finding.",
                        "severity", "HIGH",
                        "createdBy", Map.of("userId", "analyst", "role", "InvestmentAnalyst"),
                        "riskConfirmation", ""
                )),
                List.of("PENDING_LITIGATION"),
                true,
                List.of("LEVEL_2", "LEVEL_3"),
                List.of()
        );
    }

    private Map<String, Object> seedRequestData(
            String label,
            String scenario,
            String companyName,
            String stage,
            String sector,
            int amount,
            String instrument,
            String useOfFunds,
            List<Map<String, Object>> founders,
            List<Map<String, Object>> exceptions,
            List<String> indicators,
            boolean hasMaterialException,
            List<String> investmentApprovalLevels,
            List<String> riskApprovalLevels
    ) {
        return Map.of(
                "demo", Map.of("label", label, "scenario", scenario),
                "company", Map.of(
                        "name", companyName,
                        "stage", stage,
                        "sector", sector,
                        "foundedDate", "2024-04-01",
                        "incorporated", "YES"
                ),
                "investment", Map.of(
                        "amount", amount,
                        "instrument", instrument,
                        "useOfFunds", useOfFunds
                ),
                "approvalRequirements", Map.of(
                        "investmentLevels", investmentApprovalLevels,
                        "riskLevels", riskApprovalLevels
                ),
                "founders", founders,
                "exceptions", exceptions,
                "indicators", indicators,
                "risk", Map.of(
                        "hasMaterialException", hasMaterialException,
                        "enhancedReviewNarrative", "",
                        "recommendation", "",
                        "pageConfirmations", Map.of(
                                "companyProfile", "",
                                "investmentTerms", "",
                                "foundersOwnership", ""
                        ),
                        "pageConfirmationNotes", Map.of(
                                "companyProfile", "",
                                "investmentTerms", "",
                                "foundersOwnership", ""
                        )
                )
        );
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read demo JSON", e);
        }
    }

    private List<String> readStringList(String json) {
        List<String> values = new ArrayList<>();
        readJson(json).forEach(value -> values.add(value.asText()));
        return List.copyOf(values);
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write demo JSON", e);
        }
    }
}
