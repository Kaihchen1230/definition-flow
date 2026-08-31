package com.example.approvalpoc.audit;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEventEntity, Long> {
    Optional<AuditEventEntity> findFirstByRequestCaseIdAndEventTypeOrderByCreatedAtDesc(UUID requestCaseId, String eventType);
}
