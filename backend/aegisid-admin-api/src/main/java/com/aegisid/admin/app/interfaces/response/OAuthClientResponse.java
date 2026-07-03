package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.domain.model.OAuthClient;
import java.time.LocalDateTime;
import java.util.List;

public record OAuthClientResponse(
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
    public static OAuthClientResponse from(OAuthClient oauthClient) {
        return new OAuthClientResponse(
                oauthClient.id(),
                oauthClient.applicationId(),
                oauthClient.clientId(),
                oauthClient.clientName(),
                oauthClient.clientType(),
                oauthClient.tokenEndpointAuthMethod(),
                oauthClient.grantTypes(),
                oauthClient.responseTypes(),
                oauthClient.redirectUris(),
                oauthClient.postLogoutRedirectUris(),
                oauthClient.scopes(),
                oauthClient.accessTokenTtlSeconds(),
                oauthClient.refreshTokenTtlSeconds(),
                oauthClient.requirePkce(),
                oauthClient.status(),
                oauthClient.createdAt(),
                oauthClient.updatedAt()
        );
    }
}

