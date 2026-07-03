package com.aegisid.admin.app.infrastructure.persistence.repository;

import com.aegisid.admin.app.domain.model.ClientSecret;
import com.aegisid.admin.app.domain.repository.ClientSecretRepository;
import com.aegisid.admin.app.infrastructure.persistence.entity.ClientSecretEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ClientSecretMapper;
import org.springframework.stereotype.Repository;

@Repository
public class MybatisClientSecretRepository implements ClientSecretRepository {
    private final ClientSecretMapper clientSecretMapper;

    public MybatisClientSecretRepository(ClientSecretMapper clientSecretMapper) {
        this.clientSecretMapper = clientSecretMapper;
    }

    @Override
    public ClientSecret save(ClientSecret clientSecret) {
        ClientSecretEntity entity = toEntity(clientSecret);
        clientSecretMapper.insert(entity);
        return toDomain(entity);
    }

    private ClientSecret toDomain(ClientSecretEntity entity) {
        return new ClientSecret(
                entity.getId(),
                entity.getClientId(),
                entity.getSecretHash(),
                entity.getSecretHint(),
                entity.getActiveFrom(),
                entity.getExpiresAt(),
                entity.getStatus(),
                entity.getCreatedAt()
        );
    }

    private ClientSecretEntity toEntity(ClientSecret clientSecret) {
        ClientSecretEntity entity = new ClientSecretEntity();
        entity.setId(clientSecret.id());
        entity.setClientId(clientSecret.clientId());
        entity.setSecretHash(clientSecret.secretHash());
        entity.setSecretHint(clientSecret.secretHint());
        entity.setActiveFrom(clientSecret.activeFrom());
        entity.setExpiresAt(clientSecret.expiresAt());
        entity.setStatus(clientSecret.status());
        entity.setCreatedAt(clientSecret.createdAt());
        return entity;
    }
}

