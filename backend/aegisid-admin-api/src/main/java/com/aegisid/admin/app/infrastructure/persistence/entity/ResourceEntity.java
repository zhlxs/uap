package com.aegisid.admin.app.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("uap_resource")
public class ResourceEntity {
    @TableId
    private String id;
    private String applicationId;
    private String parentId;
    private String resourceCode;
    private String resourceName;
    private String resourceType;
    private String path;
    private String httpMethod;
    private String urlPattern;
    private String icon;
    private String component;
    private Integer sortOrder;
    private Boolean visible;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public String getId() { return id; }

    public void setId(String id) { this.id = id; }

    public String getApplicationId() { return applicationId; }

    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getParentId() { return parentId; }

    public void setParentId(String parentId) { this.parentId = parentId; }

    public String getResourceCode() { return resourceCode; }

    public void setResourceCode(String resourceCode) { this.resourceCode = resourceCode; }

    public String getResourceName() { return resourceName; }

    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public String getResourceType() { return resourceType; }

    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getPath() { return path; }

    public void setPath(String path) { this.path = path; }

    public String getHttpMethod() { return httpMethod; }

    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public String getUrlPattern() { return urlPattern; }

    public void setUrlPattern(String urlPattern) { this.urlPattern = urlPattern; }

    public String getIcon() { return icon; }

    public void setIcon(String icon) { this.icon = icon; }

    public String getComponent() { return component; }

    public void setComponent(String component) { this.component = component; }

    public Integer getSortOrder() { return sortOrder; }

    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getVisible() { return visible; }

    public void setVisible(Boolean visible) { this.visible = visible; }

    public String getStatus() { return status; }

    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
