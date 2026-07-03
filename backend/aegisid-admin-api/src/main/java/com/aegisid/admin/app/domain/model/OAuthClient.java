package com.aegisid.admin.app.domain.model;

import java.time.LocalDateTime;
import java.util.List;

public record OAuthClient(
        String id,
        String applicationId,
        String clientId,
        String clientName,
        String clientType,
        String tokenEndpointAuthMethod,
        List<String> grantTypes,
        List<String> responseTypes,
        List<String> redirectUris,
        List<String> postLogoutRedirectUris,
        List<String> scopes,
        Integer accessTokenTtlSeconds,
        Integer refreshTokenTtlSeconds,
        Boolean requirePkce,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}

