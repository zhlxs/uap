package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateScopeRequest(
        @NotBlank @Size(max = 128) String scopeCode,
        @NotBlank @Size(max = 128) String scopeName,
        @Size(max = 512) String description
) {
}
