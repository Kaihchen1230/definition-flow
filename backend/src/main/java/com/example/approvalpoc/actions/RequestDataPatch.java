package com.example.approvalpoc.actions;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public record RequestDataPatch(List<PathUpdate> updates) {
    public record PathUpdate(String path, JsonNode value) {
    }
}
