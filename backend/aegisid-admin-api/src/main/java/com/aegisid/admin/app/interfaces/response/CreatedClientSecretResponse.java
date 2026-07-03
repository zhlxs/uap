package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.application.query.CreatedClientSecret;
import java.time.LocalDateTime;

public record CreatedClientSecretResponse(
        String id,
        String clientId,
        String secret,
        String secretHint,
        LocalDateTime createdAt
) {
    public static CreatedClientSecretResponse from(CreatedClientSecret secret) {
        return new CreatedClientSecretResponse(
                secret.id(),
                secret.clientId(),
                secret.secret(),
                secret.secretHint(),
                secret.createdAt()
        );
    }
}

