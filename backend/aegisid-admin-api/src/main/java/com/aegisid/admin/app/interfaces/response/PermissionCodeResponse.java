package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.PermissionCodeEntity;
import java.time.LocalDateTime;

public record PermissionCodeResponse(
        String id,
        String applicationId,
        String permissionCode,
        String permissionName,
        String description,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PermissionCodeResponse from(PermissionCodeEntity permissionCode) {
        return new PermissionCodeResponse(
                permissionCode.getId(),
                permissionCode.getApplicationId(),
                permissionCode.getPermissionCode(),
                permissionCode.getPermissionName(),
                permissionCode.getDescription(),
                permissionCode.getStatus(),
                permissionCode.getCreatedAt(),
                permissionCode.getUpdatedAt()
        );
    }
}
