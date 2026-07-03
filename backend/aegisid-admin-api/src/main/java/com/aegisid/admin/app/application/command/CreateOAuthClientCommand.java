package com.aegisid.admin.app.application.command;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateOAuthClientCommand(
        @NotBlank @Size(max = 64) String applicationId,
        @NotBlank @Size(max = 128) String clientName,
        @NotBlank @Size(max = 32) String clientType,
        @NotBlank @Size(max = 64) String tokenEndpointAuthMethod,
        @NotEmpty List<@NotBlank @Size(max = 64) String> grantTypes,
        @NotEmpty List<@NotBlank @Size(max = 64) String> responseTypes,
        @NotEmpty List<@NotBlank @Size(max = 512) String> redirectUris,
        List<@NotBlank @Size(max = 512) String> postLogoutRedirectUris,
        @NotEmpty List<@NotBlank @Size(max = 64) String> scopes,
        @NotNull @Positive Integer accessTokenTtlSeconds,
        @NotNull @Positive Integer refreshTokenTtlSeconds,
        @NotNull Boolean requirePkce
) {
}

