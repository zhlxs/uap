package com.aegisid.admin.app.infrastructure.persistence.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("iam_role_permission")
public class RolePermissionEntity {
    private String roleId;
    private String permissionCodeId;
    private LocalDateTime createdAt;

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getPermissionCodeId() {
        return permissionCodeId;
    }

    public void setPermissionCodeId(String permissionCodeId) {
        this.permissionCodeId = permissionCodeId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
