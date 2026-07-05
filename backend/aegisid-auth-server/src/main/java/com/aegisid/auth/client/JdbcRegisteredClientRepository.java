package com.aegisid.auth.client;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import javax.sql.DataSource;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClient;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.settings.ClientSettings;
import org.springframework.security.oauth2.server.authorization.settings.TokenSettings;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * 基于 uap_oauth_client 的注册客户端仓库。
 *
 * <p>客户端由管理后台统一维护，认证服务只读取启用状态的客户端。机密客户端的口令来自
 * uap_client_secret 的最新有效记录；由于管理后台以裸 BCrypt 存储，这里补上 {bcrypt} 前缀，
 * 以便委派式口令编码器校验。多值字段以换行符分隔，与管理后台写入约定一致。
 */
@Repository
public class JdbcRegisteredClientRepository implements RegisteredClientRepository {
    private static final String SEPARATOR = "\n";
    private static final String AUTH_METHOD_NONE = "none";
    private static final String BCRYPT_PREFIX = "{bcrypt}";

    private final JdbcTemplate jdbcTemplate;

    public JdbcRegisteredClientRepository(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    @Override
    public void save(RegisteredClient registeredClient) {
        throw new UnsupportedOperationException("OAuth 客户端由管理后台维护，认证服务不支持写入");
    }

    @Override
    public RegisteredClient findById(String id) {
        return queryOne("SELECT * FROM uap_oauth_client WHERE id = ? AND status = 'active'", id);
    }

    @Override
    public RegisteredClient findByClientId(String clientId) {
        return queryOne("SELECT * FROM uap_oauth_client WHERE client_id = ? AND status = 'active'", clientId);
    }

    private RegisteredClient queryOne(String sql, String argument) {
        List<RegisteredClient> rows = jdbcTemplate.query(sql, (rs, rowNum) -> mapRow(
                rs.getString("id"),
                rs.getString("client_id"),
                rs.getString("client_name"),
                rs.getString("token_endpoint_auth_method"),
                rs.getString("grant_types"),
                rs.getString("redirect_uris"),
                rs.getString("post_logout_redirect_uris"),
                rs.getString("scopes"),
                rs.getInt("access_token_ttl_seconds"),
                rs.getInt("refresh_token_ttl_seconds"),
                rs.getBoolean("require_pkce"),
                rs.getTimestamp("created_at") == null ? null : rs.getTimestamp("created_at").toInstant()
        ), argument);
        return rows.stream().findFirst().orElse(null);
    }

    private RegisteredClient mapRow(
            String id,
            String clientId,
            String clientName,
            String authMethod,
            String grantTypes,
            String redirectUris,
            String postLogoutRedirectUris,
            String scopes,
            int accessTokenTtlSeconds,
            int refreshTokenTtlSeconds,
            boolean requirePkce,
            Instant createdAt
    ) {
        RegisteredClient.Builder builder = RegisteredClient.withId(id)
                .clientId(clientId)
                .clientIdIssuedAt(createdAt)
                .clientName(clientName)
                .clientAuthenticationMethod(new ClientAuthenticationMethod(authMethod));

        forEachValue(grantTypes, value -> builder.authorizationGrantType(new AuthorizationGrantType(value)));
        forEachValue(redirectUris, builder::redirectUri);
        forEachValue(postLogoutRedirectUris, builder::postLogoutRedirectUri);
        forEachValue(scopes, builder::scope);

        if (!AUTH_METHOD_NONE.equalsIgnoreCase(authMethod)) {
            findActiveSecretHash(clientId).ifPresent(hash -> builder.clientSecret(withEncoderPrefix(hash)));
        }

        builder.clientSettings(ClientSettings.builder()
                .requireProofKey(requirePkce)
                .requireAuthorizationConsent(false)
                .build());
        builder.tokenSettings(TokenSettings.builder()
                .accessTokenTimeToLive(Duration.ofSeconds(accessTokenTtlSeconds))
                .refreshTokenTimeToLive(Duration.ofSeconds(refreshTokenTtlSeconds))
                .reuseRefreshTokens(false)
                .build());
        return builder.build();
    }

    private java.util.Optional<String> findActiveSecretHash(String clientId) {
        String sql = "SELECT secret_hash FROM uap_client_secret"
                + " WHERE client_id = ? AND status = 'active'"
                + " AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)"
                + " ORDER BY active_from DESC";
        List<String> hashes = jdbcTemplate.queryForList(sql, String.class, clientId);
        return hashes.stream().findFirst();
    }

    private static String withEncoderPrefix(String hash) {
        return hash.startsWith("{") ? hash : BCRYPT_PREFIX + hash;
    }

    private static void forEachValue(String raw, Consumer<String> consumer) {
        if (raw == null || raw.isBlank()) {
            return;
        }
        Arrays.stream(raw.split(SEPARATOR))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .forEach(consumer);
    }
}
