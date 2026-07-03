package com.aegisid.admin.app.infrastructure.persistence.repository;

import com.aegisid.admin.app.domain.model.OAuthClient;
import com.aegisid.admin.app.domain.repository.OAuthClientRepository;
import com.aegisid.admin.app.infrastructure.persistence.entity.OAuthClientEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.OAuthClientMapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class MybatisOAuthClientRepository implements OAuthClientRepository {
    private static final String SEPARATOR = "\n";

    private final OAuthClientMapper oauthClientMapper;

    public MybatisOAuthClientRepository(OAuthClientMapper oauthClientMapper) {
        this.oauthClientMapper = oauthClientMapper;
    }

    @Override
    public Optional<OAuthClient> findByClientId(String clientId) {
        OAuthClientEntity entity = oauthClientMapper.selectOne(
                Wrappers.<OAuthClientEntity>lambdaQuery().eq(OAuthClientEntity::getClientId, clientId)
        );
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public OAuthClient save(OAuthClient oauthClient) {
        OAuthClientEntity entity = toEntity(oauthClient);
        oauthClientMapper.insert(entity);
        return toDomain(entity);
    }

    private OAuthClient toDomain(OAuthClientEntity entity) {
        return new OAuthClient(
                entity.getId(),
                entity.getApplicationId(),
                entity.getClientId(),
                entity.getClientName(),
                entity.getClientType(),
                entity.getTokenEndpointAuthMethod(),
                split(entity.getGrantTypes()),
                split(entity.getResponseTypes()),
                split(entity.getRedirectUris()),
                split(entity.getPostLogoutRedirectUris()),
                split(entity.getScopes()),
                entity.getAccessTokenTtlSeconds(),
                entity.getRefreshTokenTtlSeconds(),
                entity.getRequirePkce(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private OAuthClientEntity toEntity(OAuthClient oauthClient) {
        OAuthClientEntity entity = new OAuthClientEntity();
        entity.setId(oauthClient.id());
        entity.setApplicationId(oauthClient.applicationId());
        entity.setClientId(oauthClient.clientId());
        entity.setClientName(oauthClient.clientName());
        entity.setClientType(oauthClient.clientType());
        entity.setTokenEndpointAuthMethod(oauthClient.tokenEndpointAuthMethod());
        entity.setGrantTypes(join(oauthClient.grantTypes()));
        entity.setResponseTypes(join(oauthClient.responseTypes()));
        entity.setRedirectUris(join(oauthClient.redirectUris()));
        entity.setPostLogoutRedirectUris(join(oauthClient.postLogoutRedirectUris()));
        entity.setScopes(join(oauthClient.scopes()));
        entity.setAccessTokenTtlSeconds(oauthClient.accessTokenTtlSeconds());
        entity.setRefreshTokenTtlSeconds(oauthClient.refreshTokenTtlSeconds());
        entity.setRequirePkce(oauthClient.requirePkce());
        entity.setStatus(oauthClient.status());
        entity.setCreatedAt(oauthClient.createdAt());
        entity.setUpdatedAt(oauthClient.updatedAt());
        return entity;
    }

    private String join(List<String> values) {
        return values == null ? "" : String.join(SEPARATOR, values);
    }

    private List<String> split(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(SEPARATOR)).toList();
    }
}

