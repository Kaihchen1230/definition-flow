package com.example.approvalpoc.definition;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DefinitionService {
    private final DefinitionModuleRepository repository;
    private final ObjectMapper objectMapper;

    public DefinitionService(DefinitionModuleRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public JsonNode activeDefinition(String requestType, DefinitionModuleType moduleType) {
        return repository.findFirstByRequestTypeAndModuleTypeAndActiveTrueOrderByVersionDesc(requestType, moduleType)
                .map(DefinitionModuleEntity::getDefinitionJson)
                .map(this::readJson)
                .orElse(objectMapper.createObjectNode());
    }

    public Map<DefinitionModuleType, Integer> activeVersions(String requestType) {
        Map<DefinitionModuleType, Integer> versions = new EnumMap<>(DefinitionModuleType.class);
        for (DefinitionModuleType moduleType : DefinitionModuleType.values()) {
            repository.findFirstByRequestTypeAndModuleTypeAndActiveTrueOrderByVersionDesc(requestType, moduleType)
                    .ifPresent(module -> versions.put(moduleType, module.getVersion()));
        }
        return versions;
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (IOException e) {
            throw new IllegalStateException("Stored definition JSON could not be parsed", e);
        }
    }
}

