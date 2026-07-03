package com.aegisid.admin.app.domain.model;

import java.time.LocalDateTime;

public record Application(
        String id,
        String appCode,
        String appName,
        String appType,
        String protocol,
        String homepageUrl,
        String permissionMode,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

