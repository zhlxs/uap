package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePermissionPolicyRequest(
        @NotBlank @Size(max = 32) String permissionMode,
        @Size(max = 2048) String permissionCapabilitiesJson,
        boolean resetCapabilities
) {
}
