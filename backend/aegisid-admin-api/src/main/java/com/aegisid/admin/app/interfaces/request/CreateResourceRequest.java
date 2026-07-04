package com.aegisid.admin.app.interfaces.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateResourceRequest(
        @Size(max = 64) String parentId,
        @NotBlank @Size(max = 128) String resourceCode,
        @NotBlank @Size(max = 128) String resourceName,
        @NotBlank @Size(max = 32) String resourceType,
        @Size(max = 512) String path,
        @Size(max = 16) String httpMethod,
        @Size(max = 512) String urlPattern
) {
}
