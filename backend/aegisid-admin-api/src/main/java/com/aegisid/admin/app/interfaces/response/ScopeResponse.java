package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.ScopeEntity;
import java.time.LocalDateTime;

public record ScopeResponse(
        String id,
        String applicationId,
        String scopeCode,
        String scopeName,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ScopeResponse from(ScopeEntity scope) {
        return new ScopeResponse(
                scope.getId(),
                scope.getApplicationId(),
                scope.getScopeCode(),
                scope.getScopeName(),
                scope.getDescription(),
                scope.getStatus(),
                scope.getCreatedAt(),
                scope.getUpdatedAt()
        );
    }
}
