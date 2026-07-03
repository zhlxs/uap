package com.aegisid.admin.app.application.query;

import java.time.LocalDateTime;

public record CreatedClientSecret(
        String id,
        String clientId,
        String secret,
        String secretHint,
        LocalDateTime createdAt
) {
}

