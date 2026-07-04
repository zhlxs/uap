package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePermissionCodeRequest(
        @NotBlank @Size(max = 128) String permissionCode,
        @NotBlank @Size(max = 128) String permissionName,
        @Size(max = 512) String description
) {
}
