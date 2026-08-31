package com.example.approvalpoc.runtime;

import com.example.approvalpoc.dev.DemoUserEntity;
import com.example.approvalpoc.requestcase.RequestCaseEntity;
import com.fasterxml.jackson.databind.JsonNode;

public record RuntimeBundle(RequestCaseEntity requestCase, DemoUserEntity user, JsonNode context) {
}
