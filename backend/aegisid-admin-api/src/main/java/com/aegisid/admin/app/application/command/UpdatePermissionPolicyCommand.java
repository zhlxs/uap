package com.aegisid.admin.app.application.command;

public record UpdatePermissionPolicyCommand(
        String applicationId,
        String permissionMode,
        String permissionCapabilitiesJson,
        boolean resetCapabilities
) {
}
