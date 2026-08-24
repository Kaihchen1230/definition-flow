package com.example.approvalpoc.requestcase;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestCaseRepository extends JpaRepository<RequestCaseEntity, UUID> {
}

