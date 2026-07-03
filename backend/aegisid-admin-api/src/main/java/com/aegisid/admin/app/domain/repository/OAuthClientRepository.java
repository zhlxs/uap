package com.aegisid.admin.app.domain.repository;

import com.aegisid.admin.app.domain.model.OAuthClient;
import java.util.Optional;

public interface OAuthClientRepository {
    Optional<OAuthClient> findByClientId(String clientId);

    OAuthClient save(OAuthClient oauthClient);
}

