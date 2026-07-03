package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.domain.model.Application;
import java.time.LocalDateTime;

public record ApplicationResponse(
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
    public static ApplicationResponse from(Application application) {
        return new ApplicationResponse(
                application.id(),
                application.appCode(),
                application.appName(),
                application.appType(),
                application.protocol(),
                application.homepageUrl(),
                application.permissionMode(),
                application.permissionCapabilitiesJson(),
                application.status(),
                application.createdAt(),
                application.updatedAt()
        );
    }
}

