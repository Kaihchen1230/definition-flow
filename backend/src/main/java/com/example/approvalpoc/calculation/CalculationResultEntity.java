package com.example.approvalpoc.calculation;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calculation_result")
public class CalculationResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private UUID requestCaseId;
    private String calculationId;
    private String resultJson;
    private String inputHash;
    private String engineId;
    private String ruleSetVersion;
    private String calculatedBy;
    private Instant calculatedAt;

    protected CalculationResultEntity() {
    }

    public CalculationResultEntity(UUID requestCaseId, String calculationId, String resultJson, String inputHash, String calculatedBy, Instant calculatedAt) {
        this.requestCaseId = requestCaseId;
        this.calculationId = calculationId;
        this.resultJson = resultJson;
        this.inputHash = inputHash;
        this.calculatedBy = calculatedBy;
        this.calculatedAt = calculatedAt;
    }

    public Long getId() {
        return id;
    }

    public UUID getRequestCaseId() {
        return requestCaseId;
    }

    public String getCalculationId() {
        return calculationId;
    }

    public String getResultJson() {
        return resultJson;
    }

    public void setResultJson(String resultJson) {
        this.resultJson = resultJson;
    }

    public String getInputHash() {
        return inputHash;
    }

    public void setInputHash(String inputHash) {
        this.inputHash = inputHash;
    }

    public String getEngineId() {
        return engineId;
    }

    public void setEngineId(String engineId) {
        this.engineId = engineId;
    }

    public String getRuleSetVersion() {
        return ruleSetVersion;
    }

    public void setRuleSetVersion(String ruleSetVersion) {
        this.ruleSetVersion = ruleSetVersion;
    }

    public String getCalculatedBy() {
        return calculatedBy;
    }

    public void setCalculatedBy(String calculatedBy) {
        this.calculatedBy = calculatedBy;
    }

    public Instant getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(Instant calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}
