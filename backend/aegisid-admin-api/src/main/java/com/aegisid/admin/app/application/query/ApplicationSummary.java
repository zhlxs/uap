package com.aegisid.admin.app.application.query;

import java.time.LocalDateTime;

public record ApplicationSummary(
        String id,
        String appCode,
        String appName,
        String appType,
        String protocol,
        String permissionMode,
        String status,
        LocalDateTime createdAt
) {
}

