package com.aegisid.admin.app.domain.repository;

import com.aegisid.admin.app.domain.model.ClientSecret;

public interface ClientSecretRepository {
    ClientSecret save(ClientSecret clientSecret);
}

