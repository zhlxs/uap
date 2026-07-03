package com.aegisid.admin.app.domain.model;

import java.time.LocalDateTime;

public record ClientSecret(
        String id,
        String clientId,
        String secretHash,
        String secretHint,
        LocalDateTime activeFrom,
        LocalDateTime expiresAt,
        String status,
        LocalDateTime createdAt
) {
}

