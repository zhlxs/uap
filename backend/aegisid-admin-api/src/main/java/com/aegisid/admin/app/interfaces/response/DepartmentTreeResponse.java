package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.DepartmentEntity;
import java.time.LocalDateTime;
import java.util.List;

public record DepartmentTreeResponse(
        String id,
        String parentId,
        String name,
        String code,
        String path,
        Integer sortOrder,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<DepartmentTreeResponse> children
) {
    public static DepartmentTreeResponse from(
            DepartmentEntity department,
            List<DepartmentTreeResponse> children
    ) {
        return new DepartmentTreeResponse(
                department.getId(),
                department.getParentId(),
                department.getName(),
                department.getCode(),
                department.getPath(),
                department.getSortOrder(),
                department.getStatus(),
                department.getCreatedAt(),
                department.getUpdatedAt(),
                children
        );
    }
}
