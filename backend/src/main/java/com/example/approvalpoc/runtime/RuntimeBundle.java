package com.example.approvalpoc.runtime;

import com.example.approvalpoc.dev.DemoActorEntity;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.fasterxml.jackson.databind.JsonNode;

public record RuntimeBundle(RequestCaseEntity requestCase, DemoActorEntity actor, JsonNode context, JsonNode rulesDefinition) {
}

