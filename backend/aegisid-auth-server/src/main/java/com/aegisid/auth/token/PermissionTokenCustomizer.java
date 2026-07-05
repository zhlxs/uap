package com.aegisid.auth.token;

import com.aegisid.auth.identity.AccountDetails;
import com.aegisid.auth.identity.IdentityQueries;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.oauth2.server.authorization.OAuth2TokenType;
import org.springframework.security.oauth2.server.authorization.token.JwtEncodingContext;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenCustomizer;
import org.springframework.stereotype.Component;

/**
 * 权限 Token 定制器。
 *
 * <p>在签发 access token 与 id token 时，向令牌注入用户资料（uid、姓名、邮箱、租户）
 * 以及按目标应用维度解析出的角色、权限与 scope，使接入方无需回调即可完成鉴权。
 */
@Component
public class PermissionTokenCustomizer implements OAuth2TokenCustomizer<JwtEncodingContext> {
    private final IdentityQueries identityQueries;

    public PermissionTokenCustomizer(IdentityQueries identityQueries) {
        this.identityQueries = identityQueries;
    }

    @Override
    public void customize(JwtEncodingContext context) {
        String tokenType = context.getTokenType().getValue();
        boolean isAccessToken = OAuth2TokenType.ACCESS_TOKEN.getValue().equals(tokenType);
        boolean isIdToken = OidcParameterNames.ID_TOKEN.equals(tokenType);
        if (!isAccessToken && !isIdToken) {
            return;
        }

        String username = context.getPrincipal().getName();
        if (username == null || username.isBlank()) {
            return;
        }
        Optional<AccountDetails> account = identityQueries.findAccountByUsername(username);
        if (account.isEmpty()) {
            return;
        }
        AccountDetails details = account.get();
        String clientId = context.getRegisteredClient().getClientId();
        Optional<String> applicationId = identityQueries.findApplicationIdByClientId(clientId);

        List<String> roles = applicationId
                .map(appId -> identityQueries.findRoleCodes(username, appId))
                .orElseGet(List::of);
        List<String> permissions = applicationId
                .map(appId -> identityQueries.findPermissionCodes(username, appId))
                .orElseGet(List::of);
        List<String> scopes = applicationId
                .map(appId -> identityQueries.findScopeCodes(username, appId))
                .orElseGet(List::of);

        context.getClaims().claims(claims -> {
            claims.put("uid", details.userId());
            claims.put("preferred_username", details.username());
            putIfPresent(claims, "name", details.displayName());
            putIfPresent(claims, "email", details.email());
            putIfPresent(claims, "tenant", details.tenantId());
            claims.put("roles", roles);
            claims.put("permissions", permissions);
            if (isAccessToken) {
                claims.put("app_scopes", scopes);
            }
        });
    }

    private static void putIfPresent(Map<String, Object> claims, String key, String value) {
        if (value != null && !value.isBlank()) {
            claims.put(key, value);
        }
    }
}
