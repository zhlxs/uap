package com.aegisid.admin.app.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateApplicationCommand(
        @NotBlank @Size(max = 64) String appCode,
        @NotBlank @Size(max = 128) String appName,
        @NotBlank @Size(max = 32) String appType,
        @NotBlank @Size(max = 32) String protocol,
        @Size(max = 512) String homepageUrl,
        @NotBlank @Size(max = 32) String permissionMode,
        @Size(max = 2048) String permissionCapabilitiesJson
) {
}
