package com.example.approvalpoc.actions;

import java.util.Map;

public record ActionResult(boolean success, String message, Map<String, Object> details) {
}

