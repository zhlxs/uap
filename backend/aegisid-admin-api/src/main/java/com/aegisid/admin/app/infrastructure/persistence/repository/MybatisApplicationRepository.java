package com.aegisid.admin.app.infrastructure.persistence.repository;

import com.aegisid.admin.app.domain.model.Application;
import com.aegisid.admin.app.domain.repository.ApplicationRepository;
import com.aegisid.admin.app.infrastructure.persistence.entity.ApplicationEntity;
import com.aegisid.admin.app.infrastructure.persistence.mapper.ApplicationMapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("db")
public class MybatisApplicationRepository implements ApplicationRepository {
    private final ApplicationMapper applicationMapper;

    public MybatisApplicationRepository(ApplicationMapper applicationMapper) {
        this.applicationMapper = applicationMapper;
    }

    @Override
    public Optional<Application> findByAppCode(String appCode) {
        ApplicationEntity entity = applicationMapper.selectOne(
                Wrappers.<ApplicationEntity>lambdaQuery().eq(ApplicationEntity::getAppCode, appCode)
        );
        return Optional.ofNullable(entity).map(this::toDomain);
    }

    @Override
    public List<Application> findAll() {
        return applicationMapper.selectList(Wrappers.emptyWrapper())
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public Application save(Application application) {
        ApplicationEntity entity = toEntity(application);
        applicationMapper.insert(entity);
        return toDomain(entity);
    }

    private Application toDomain(ApplicationEntity entity) {
        return new Application(
                entity.getId(),
                entity.getAppCode(),
                entity.getAppName(),
                entity.getAppType(),
                entity.getProtocol(),
                entity.getHomepageUrl(),
                entity.getPermissionMode(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private ApplicationEntity toEntity(Application application) {
        ApplicationEntity entity = new ApplicationEntity();
        entity.setId(application.id());
        entity.setAppCode(application.appCode());
        entity.setAppName(application.appName());
        entity.setAppType(application.appType());
        entity.setProtocol(application.protocol());
        entity.setHomepageUrl(application.homepageUrl());
        entity.setPermissionMode(application.permissionMode());
        entity.setStatus(application.status());
        entity.setCreatedAt(application.createdAt());
        entity.setUpdatedAt(application.updatedAt());
        return entity;
    }
}

