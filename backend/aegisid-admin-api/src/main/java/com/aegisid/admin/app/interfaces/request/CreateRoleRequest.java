package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest(
        @NotBlank @Size(max = 64) String roleCode,
        @NotBlank @Size(max = 128) String roleName
) {
}
