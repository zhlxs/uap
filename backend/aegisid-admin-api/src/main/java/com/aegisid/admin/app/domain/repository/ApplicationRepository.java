package com.aegisid.admin.app.domain.repository;

import com.aegisid.admin.app.domain.model.Application;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository {
    Optional<Application> findByAppCode(String appCode);

    List<Application> findAll();

    Application save(Application application);
}

