package com.example.approvalpoc.definition;

import java.util.Map;

public record DefinitionReloadResult(String requestType, Map<DefinitionModuleType, Integer> loadedVersions) {
}

