package com.example.approvalpoc.calculation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalculationResultRepository extends JpaRepository<CalculationResultEntity, Long> {
    Optional<CalculationResultEntity> findFirstByRequestCaseIdAndCalculationIdOrderByCalculatedAtDesc(UUID requestCaseId, String calculationId);

    List<CalculationResultEntity> findByRequestCaseId(UUID requestCaseId);
}

