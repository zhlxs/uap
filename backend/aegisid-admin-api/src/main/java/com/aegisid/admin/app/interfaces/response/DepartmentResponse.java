package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.DepartmentEntity;
import java.time.LocalDateTime;

public record DepartmentResponse(
        String id,
        String parentId,
        String name,
        String code,
        String path,
        Integer sortOrder,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static DepartmentResponse from(DepartmentEntity department) {
        return new DepartmentResponse(
                department.getId(),
                department.getParentId(),
                department.getName(),
                department.getCode(),
                department.getPath(),
                department.getSortOrder(),
                department.getStatus(),
                department.getCreatedAt(),
                department.getUpdatedAt()
        );
    }
}
