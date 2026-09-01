package com.example.approvalpoc.dev;

import java.util.List;

public record DemoUserSummary(
        String id,
        String displayName,
        String role,
        List<String> entitlements
) {
}
