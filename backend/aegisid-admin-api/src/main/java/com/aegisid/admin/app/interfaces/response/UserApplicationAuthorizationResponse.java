package com.aegisid.admin.app.interfaces.response;

import java.util.List;

public record UserApplicationAuthorizationResponse(
        String applicationId,
        String appCode,
        String appName,
        String appType,
        String protocol,
        String permissionMode,
        String status,
        List<RoleResponse> roles
) {
}
