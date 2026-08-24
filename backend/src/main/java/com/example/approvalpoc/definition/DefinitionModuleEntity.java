package com.example.approvalpoc.definition;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "definition_module")
public class DefinitionModuleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String requestType;
    @Enumerated(EnumType.STRING)
    private DefinitionModuleType moduleType;
    private int version;
    private boolean active;
    private String definitionJson;
    private Instant createdAt;

    protected DefinitionModuleEntity() {
    }

    public DefinitionModuleEntity(String requestType, DefinitionModuleType moduleType, int version, boolean active, String definitionJson, Instant createdAt) {
        this.requestType = requestType;
        this.moduleType = moduleType;
        this.version = version;
        this.active = active;
        this.definitionJson = definitionJson;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getRequestType() {
        return requestType;
    }

    public DefinitionModuleType getModuleType() {
        return moduleType;
    }

    public int getVersion() {
        return version;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getDefinitionJson() {
        return definitionJson;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

