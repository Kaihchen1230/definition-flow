package com.example.approvalpoc.definition;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DefinitionModuleRepository extends JpaRepository<DefinitionModuleEntity, Long> {
    List<DefinitionModuleEntity> findByRequestTypeAndModuleType(String requestType, DefinitionModuleType moduleType);

    Optional<DefinitionModuleEntity> findFirstByRequestTypeAndModuleTypeAndActiveTrueOrderByVersionDesc(
            String requestType,
            DefinitionModuleType moduleType
    );
}

