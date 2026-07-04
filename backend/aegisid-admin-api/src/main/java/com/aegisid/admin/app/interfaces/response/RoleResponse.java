package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.RoleEntity;
import java.time.LocalDateTime;

public record RoleResponse(
        String id,
        String applicationId,
        String roleCode,
        String roleName,
        String roleType,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RoleResponse from(RoleEntity role) {
        return new RoleResponse(
                role.getId(),
                role.getApplicationId(),
                role.getRoleCode(),
                role.getRoleName(),
                role.getRoleType(),
                role.getStatus(),
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }
}
