package com.example.approvalpoc.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {
    List<AuditEventEntity> findByRequestCaseIdOrderByCreatedAtAsc(UUID requestCaseId);
}

