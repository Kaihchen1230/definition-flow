package com.example.approvalpoc.dev;

import com.example.approvalpoc.audit.AuditEventRepository;
import com.example.approvalpoc.calculation.CalculationResultRepository;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.example.approvalpoc.requestcase.RequestCaseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoDataService {
    public static final UUID DEMO_REQUEST_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
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
        requestCaseRepository.save(new RequestCaseEntity(
                DEMO_REQUEST_ID,
                "startupInvestment",
                "INVESTMENT_REVIEW",
                "analyst",
                "analyst",
                writeJson(seedRequestData()),
                Instant.now(),
                Instant.now()
        ));

        return Map.of(
                "requestCaseId", DEMO_REQUEST_ID.toString(),
                "users", userRepository.findAll().size()
        );
    }

    private void seedUsers() {
        userRepository.save(new DemoUserEntity(
                "analyst",
                "Avery Analyst",
                "InvestmentAnalyst",
                writeJson(List.of("EDIT_INVESTMENT_REQUEST", "WITHDRAW_REQUEST")),
                writeJson(List.of("InvestmentTeam"))
        ));
        userRepository.save(new DemoUserEntity(
                "investment-approver",
                "Iris Investment Approver",
                "InvestmentAnalyst",
                writeJson(List.of("EDIT_INVESTMENT_REQUEST", "APPROVE_INVESTMENT_REVIEW", "DECLINE_REQUEST", "WITHDRAW_REQUEST")),
                writeJson(List.of("InvestmentTeam"))
        ));
        userRepository.save(new DemoUserEntity(
                "risk-officer",
                "Riley Risk Officer",
                "RiskOfficer",
                writeJson(List.of("EDIT_RISK_REVIEW")),
                writeJson(List.of("RiskTeam"))
        ));
        userRepository.save(new DemoUserEntity(
                "risk-approver",
                "Reese Risk Approver",
                "RiskOfficer",
                writeJson(List.of("EDIT_RISK_REVIEW", "APPROVE_FINAL_REQUEST", "DECLINE_REQUEST")),
                writeJson(List.of("RiskTeam"))
        ));
        userRepository.save(new DemoUserEntity(
                "support",
                "Sam Support Viewer",
                "Support",
                writeJson(List.of("VIEW_REQUEST")),
                writeJson(List.of("Support"))
        ));
    }

    private Map<String, Object> seedRequestData() {
        return Map.of(
                "company", Map.of(
                        "name", "Acme Robotics",
                        "stage", "SEED",
                        "sector", "AI",
                        "foundedDate", "2024-04-01",
                        "incorporated", "YES"
                ),
                "investment", Map.of(
                        "amount", 6500000,
                        "instrument", "SAFE",
                        "useOfFunds", "Expand compute infrastructure and hire go-to-market team."
                ),
                "founders", List.of(
                        Map.of("name", "Mina Chen", "title", "CEO", "ownershipPercent", 42, "backgroundCheck", "YES"),
                        Map.of("name", "Leo Park", "title", "CTO", "ownershipPercent", 38, "backgroundCheck", "YES")
                ),
                "exceptions", List.of(
                        Map.of(
                                "id", "ex-1",
                                "description", "Customer concentration above policy threshold.",
                                "severity", "HIGH",
                                "createdBy", Map.of("userId", "analyst", "role", "InvestmentAnalyst"),
                                "riskConfirmation", ""
                        )
                ),
                "indicators", List.of("HIGH_BURN_RATE", "DATA_PRIVACY_EXPOSURE"),
                "risk", Map.of("hasMaterialException", true, "enhancedReviewNarrative", "", "recommendation", "")
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not write demo JSON", e);
        }
    }
}
