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
        String permissionCapabilitiesJson,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public Application withStatus(String nextStatus, LocalDateTime updatedAt) {
        return new Application(
                id,
                appCode,
                appName,
                appType,
                protocol,
                homepageUrl,
                permissionMode,
                permissionCapabilitiesJson,
                nextStatus,
                createdAt,
                updatedAt
        );
    }
}
