package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDepartmentRequest(
        @Size(max = 64) String parentId,
        @NotBlank @Size(max = 128) String name,
        @NotBlank @Size(max = 64) String code,
        Integer sortOrder
) {
}
