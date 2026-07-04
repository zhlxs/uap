package com.aegisid.admin.app.interfaces.response;

import com.aegisid.admin.app.infrastructure.persistence.entity.ResourceEntity;
import java.time.LocalDateTime;

public record ResourceResponse(
        String id,
        String applicationId,
        String parentId,
        String resourceCode,
        String resourceName,
        String resourceType,
        String path,
        String httpMethod,
        String urlPattern,
        Integer sortOrder,
        Boolean visible,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ResourceResponse from(ResourceEntity resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getApplicationId(),
                resource.getParentId(),
                resource.getResourceCode(),
                resource.getResourceName(),
                resource.getResourceType(),
                resource.getPath(),
                resource.getHttpMethod(),
                resource.getUrlPattern(),
                resource.getSortOrder(),
                resource.getVisible(),
                resource.getStatus(),
                resource.getCreatedAt(),
                resource.getUpdatedAt()
        );
    }
}
