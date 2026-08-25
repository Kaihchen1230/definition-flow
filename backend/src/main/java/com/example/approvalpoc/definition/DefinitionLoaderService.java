package com.example.approvalpoc.definition;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DefinitionLoaderService {
    private final DefinitionModuleRepository repository;
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
    private final ObjectMapper jsonMapper = new ObjectMapper();
    private final Path definitionsRoot;

    public DefinitionLoaderService(
            DefinitionModuleRepository repository,
            @Value("${poc.definitions-root}") String definitionsRoot
    ) {
        this.repository = repository;
        this.definitionsRoot = Path.of(definitionsRoot);
    }

    @Transactional
    public DefinitionReloadResult reload(String requestTypeSlug) throws IOException {
        String requestType = toRequestType(requestTypeSlug);
        Path requestDefinitionDir = definitionsRoot.resolve(requestTypeSlug);

        Map<DefinitionModuleType, String> files = Map.of(
                DefinitionModuleType.DATA_SCHEMA, "data-schema.yaml",
                DefinitionModuleType.RULES, "rules.yaml",
                DefinitionModuleType.DERIVED_FACTS, "derived-facts.yaml",
                DefinitionModuleType.CALCULATIONS, "calculations.yaml",
                DefinitionModuleType.WORKFLOW, "workflow.yaml"
        );

        Map<DefinitionModuleType, Integer> loaded = new EnumMap<>(DefinitionModuleType.class);
        for (Map.Entry<DefinitionModuleType, String> entry : files.entrySet()) {
            Path file = requestDefinitionDir.resolve(entry.getValue());
            if (!Files.exists(file)) {
                continue;
            }
            JsonNode yaml = yamlMapper.readTree(file.toFile());
            String normalizedJson = jsonMapper.writeValueAsString(yaml);
            int nextVersion = repository.findByRequestTypeAndModuleType(requestType, entry.getKey())
                    .stream()
                    .mapToInt(DefinitionModuleEntity::getVersion)
                    .max()
                    .orElse(0) + 1;

            repository.findByRequestTypeAndModuleType(requestType, entry.getKey())
                    .forEach(module -> module.setActive(false));

            repository.save(new DefinitionModuleEntity(
                    requestType,
                    entry.getKey(),
                    nextVersion,
                    true,
                    normalizedJson,
                    Instant.now()
            ));
            loaded.put(entry.getKey(), nextVersion);
        }
        repository.findByRequestTypeAndModuleType(requestType, DefinitionModuleType.UI)
                .forEach(module -> module.setActive(false));

        return new DefinitionReloadResult(requestType, loaded);
    }

    private String toRequestType(String slug) {
        String[] parts = slug.split("-");
        if (parts.length == 0) {
            return slug;
        }
        StringBuilder value = new StringBuilder(parts[0]);
        for (int i = 1; i < parts.length; i++) {
            if (!parts[i].isBlank()) {
                value.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
            }
        }
        return value.toString();
    }
}
